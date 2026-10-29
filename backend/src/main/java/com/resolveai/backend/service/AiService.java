package com.resolveai.backend.service;

import com.resolveai.backend.entity.Message;
import com.resolveai.backend.entity.Ticket;
import com.resolveai.backend.entity.User;
import com.resolveai.backend.repository.MessageRepository;
import com.resolveai.backend.repository.TicketRepository;
import com.resolveai.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Core AI Service orchestrating LLM interactions (Groq, Gemini, OpenAI)
 * and intelligent support automation across tickets and live chat.
 */
@Service
@Transactional
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final LlmService llmService;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    public AiService(LlmService llmService,
                     TicketRepository ticketRepository,
                     UserRepository userRepository,
                     MessageRepository messageRepository) {
        this.llmService = llmService;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    /**
     * Retrieve status of configured AI providers and default models.
     */
    public Map<String, Object> getConfigStatus() {
        return llmService.getConfigStatus();
    }

    /**
     * Interactive conversational support chat handler powered by Groq / LLM.
     */
    public Map<String, Object> processChat(String message, Integer userId, String apiKey, String provider, String model) {
        if (message == null || message.isBlank()) {
            return Map.of("error", "Message cannot be empty", "reply", "Please type a message to start.");
        }

        // Build rich contextual support persona
        StringBuilder systemContext = new StringBuilder();
        systemContext.append("You are ResolveAI Autonomous Support Intelligence, a real-time, helpful, empathetic, and expert technical support agent.\n");
        systemContext.append("You assist customers with support tickets, billing inquiries (e.g. 504 timeouts, card charges), account security (2FA/MFA setup), and general troubleshooting.\n");
        systemContext.append("Format your responses cleanly with markdown (bold, bullet points, headers) for readability. Be friendly, concise, and solution-focused.\n");

        if (userId != null) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                systemContext.append("\nCurrent logged-in customer: ").append(user.getFullName())
                             .append(" (Email: ").append(user.getEmail()).append(").\n");
                List<Ticket> userTickets = ticketRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
                if (!userTickets.isEmpty()) {
                    systemContext.append("Customer's recent support tickets:\n");
                    for (int i = 0; i < Math.min(3, userTickets.size()); i++) {
                        Ticket t = userTickets.get(i);
                        systemContext.append("- Ticket #").append(t.getTicketId())
                                     .append(" [").append(t.getStatus()).append("]: ")
                                     .append(t.getSubject()).append("\n");
                    }
                }
            }
        }

        // Generate response via LlmService (Groq Cloud)
        LlmService.LlmResult result = llmService.generateReply(message, systemContext.toString(), apiKey, provider, model);

        Map<String, Object> response = new HashMap<>();
        if (result != null && result.getText() != null && !result.getText().isBlank()) {
            response.put("reply", result.getText());
            response.put("provider", result.getProvider());
            response.put("model", result.getModel());
            response.put("status", "SUCCESS");
        } else {
            // High quality fallback when network or API key is unavailable
            String fallbackReply = generateFallbackReply(message);
            response.put("reply", fallbackReply);
            response.put("provider", "builtin");
            response.put("model", "resolveai-expert");
            response.put("status", "FALLBACK");
        }

        response.put("suggestions", generateSuggestions(message));
        return response;
    }

    /**
     * Generate an AI drafted response for support agents reviewing a ticket.
     */
    public Map<String, Object> suggestTicketReply(Integer ticketId, String apiKey, String provider, String model) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        List<Message> history = messageRepository.findByTicket_TicketIdOrderByCreatedAtAsc(ticketId);
        StringBuilder threadText = new StringBuilder();
        threadText.append("Ticket #").append(ticket.getTicketId()).append(": ").append(ticket.getSubject()).append("\n");
        threadText.append("Category: ").append(ticket.getCategory() != null ? ticket.getCategory() : "General").append("\n");
        threadText.append("Customer Problem Description: ").append(ticket.getDescription()).append("\n");
        if (!history.isEmpty()) {
            threadText.append("Conversation thread history:\n");
            for (Message m : history) {
                String senderName = m.getSender() != null ? m.getSender().getFullName() : "User";
                threadText.append(senderName).append(": ").append(m.getMessageText()).append("\n");
            }
        }

        String prompt = "Draft an empathetic, concise, and professional agent reply to resolve the user's issue or outline next steps.";
        LlmService.LlmResult result = llmService.generateReply(prompt, threadText.toString(), apiKey, provider, model);

        String replyText = (result != null && result.getText() != null)
                ? result.getText()
                : "Hello! Thank you for reaching out regarding \"" + ticket.getSubject() + "\". Our support team is investigating this issue and will update you shortly.";

        Map<String, Object> res = new HashMap<>();
        res.put("ticketId", ticketId);
        res.put("suggestedReply", replyText);
        res.put("provider", result != null ? result.getProvider() : "builtin");
        res.put("model", result != null ? result.getModel() : "resolveai-expert");
        return res;
    }

    /**
     * Automatically post a diagnostic assistant message into a ticket thread.
     */
    public Message autoAssistTicketThread(Integer ticketId, String apiKey, String provider, String model) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        User botUser = getOrCreateBotUser();

        List<Message> history = messageRepository.findByTicket_TicketIdOrderByCreatedAtAsc(ticketId);
        StringBuilder context = new StringBuilder();
        context.append("You are ResolveAI Autonomous Diagnostic Assistant replying directly in the customer's support thread.\n");
        context.append("Ticket Subject: ").append(ticket.getSubject()).append("\n");
        context.append("Ticket Description: ").append(ticket.getDescription()).append("\n");
        if (!history.isEmpty()) {
            context.append("Thread context:\n");
            for (Message m : history) {
                context.append(m.getSender().getFullName()).append(": ").append(m.getMessageText()).append("\n");
            }
        }

        String prompt = "Analyze the ticket issue and provide an immediate, helpful first-response diagnostic and troubleshooting guidance for the user.";
        LlmService.LlmResult result = llmService.generateReply(prompt, context.toString(), apiKey, provider, model);

        String replyText = (result != null && result.getText() != null)
                ? result.getText()
                : "Hello! ResolveAI automated diagnostics: We have logged your issue regarding \"" + ticket.getSubject() + "\". A priority support specialist has been assigned.";

        Message aiMsg = new Message();
        aiMsg.setTicket(ticket);
        aiMsg.setSender(botUser);
        aiMsg.setMessageText(replyText);
        return messageRepository.save(aiMsg);
    }

    /**
     * Reply to a ticket message directly using AI.
     */
    public Message replyToTicketWithAi(Integer ticketId, String userMessage, String apiKey, String provider, String model) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

        User botUser = getOrCreateBotUser();

        StringBuilder context = new StringBuilder();
        context.append("You are ResolveAI Live Support Agent answering a user message inside ticket #").append(ticketId)
               .append(" (").append(ticket.getSubject()).append(").\n")
               .append("Ticket Description: ").append(ticket.getDescription()).append("\n");

        LlmService.LlmResult result = llmService.generateReply(userMessage, context.toString(), apiKey, provider, model);

        String replyText = (result != null && result.getText() != null)
                ? result.getText()
                : "Thank you for the message. We have updated your ticket #" + ticketId + " and are reviewing the details right away.";

        Message aiMsg = new Message();
        aiMsg.setTicket(ticket);
        aiMsg.setSender(botUser);
        aiMsg.setMessageText(replyText);
        return messageRepository.save(aiMsg);
    }

    private User getOrCreateBotUser() {
        return userRepository.findByEmail("bot@resolveai.com").orElseGet(() -> {
            Optional<User> firstAgent = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.AGENT || u.getRole() == User.Role.ADMIN)
                    .findFirst();
            if (firstAgent.isPresent()) {
                return firstAgent.get();
            }
            User newBot = new User();
            newBot.setFullName("ResolveAI Assistant");
            newBot.setEmail("bot@resolveai.com");
            newBot.setPassword("$2a$12$eXampleHashedPasswordForBotAccount123456789012");
            newBot.setRole(User.Role.AGENT);
            return userRepository.save(newBot);
        });
    }

    private String generateFallbackReply(String query) {
        String q = query.toLowerCase();
        if (q.contains("ticket") || q.contains("status")) {
            return "🔍 **Ticket Tracking**\n\nYou can track and manage all your support tickets directly from the **Tickets** dashboard. Each ticket displays current assigned agents and status tags.";
        }
        if (q.contains("billing") || q.contains("504") || q.contains("payment") || q.contains("card")) {
            return "💳 **Billing & Payment Support**\n\n• **504 Gateway Timeouts:** Often indicate the payment processor took too long to confirm. Funds are typically held in authorization and auto-revert within 24-48 business hours.\n• If your subscription has not renewed, you can file a **Billing ticket** for immediate review.";
        }
        if (q.contains("2fa") || q.contains("mfa") || q.contains("security")) {
            return "🔐 **Two-Factor Authentication (2FA)**\n\nTo enforce 2FA:\n1. Go to **Settings > Security**.\n2. Click **Enable Two-Factor Authentication**.\n3. Scan the QR code using Google Authenticator or Authy.\n4. Enter the 6-digit verification code.";
        }
        if (q.contains("hi") || q.contains("hello") || q.contains("hey")) {
            return "👋 **Hello!** I am ResolveAI Assistant. How can I help you today? You can ask me about billing, account security, or managing your support tickets.";
        }
        return "🤖 **ResolveAI Support**\n\nI received your query: \"" + query + "\". I can help you resolve support requests, track tickets, manage billing inquiries, or connect you with a live agent.";
    }

    private List<String> generateSuggestions(String query) {
        String q = query.toLowerCase();
        if (q.contains("ticket")) {
            return List.of("View All Tickets", "Create New Ticket", "Billing Help");
        }
        if (q.contains("billing") || q.contains("504")) {
            return List.of("Create Billing Ticket", "Check Payment Status", "2FA Security");
        }
        return List.of("🔍 Track Tickets", "💳 Billing Help", "🔐 2FA Setup", "📝 Create New Ticket");
    }
}
