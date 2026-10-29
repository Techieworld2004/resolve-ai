package com.resolveai.backend.service;

import com.resolveai.backend.entity.Message;
import com.resolveai.backend.entity.Ticket;
import com.resolveai.backend.entity.User;
import com.resolveai.backend.repository.MessageRepository;
import com.resolveai.backend.repository.TicketRepository;
import com.resolveai.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Business logic for per-ticket conversation messages.
 */
@Service
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final TicketRepository  ticketRepository;
    private final UserRepository    userRepository;

    public MessageService(MessageRepository messageRepository,
                          TicketRepository ticketRepository,
                          UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.ticketRepository  = ticketRepository;
        this.userRepository    = userRepository;
    }

    /**
     * Post a new message to a ticket thread.
     *
     * @param ticketId    the ticket the message belongs to
     * @param senderId    the user posting the message
     * @param messageText the message body
     * @return the persisted {@link Message}
     * @throws RuntimeException if the ticket or sender is not found
     */
    public Message postMessage(Integer ticketId, Integer senderId, String messageText) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("User not found: " + senderId));

        Message message = new Message();
        message.setTicket(ticket);
        message.setSender(sender);
        message.setMessageText(messageText);
        return messageRepository.save(message);
    }

    /**
     * Return all messages for a ticket, ordered oldest-first.
     *
     * @param ticketId the ticket whose conversation to retrieve
     * @return list of messages (may be empty if no messages yet)
     */
    @Transactional(readOnly = true)
    public List<Message> getMessagesByTicket(Integer ticketId) {
        return messageRepository.findByTicket_TicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional(readOnly = true)
    public List<Message> getAllMessages() {
        return messageRepository.findAll();
    }
}
