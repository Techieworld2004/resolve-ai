package com.resolveai.backend.service;

import com.resolveai.backend.entity.Ticket;
import com.resolveai.backend.entity.User;
import com.resolveai.backend.repository.MessageRepository;
import com.resolveai.backend.repository.TicketRepository;
import com.resolveai.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    public TicketService(TicketRepository ticketRepository,
                         UserRepository userRepository,
                         MessageRepository messageRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    public Ticket createTicket(Ticket ticket, Integer userId) {
        Integer targetUserId = userId;
        if (targetUserId == null && ticket.getUser() != null) {
            targetUserId = ticket.getUser().getUserId();
        }

        if (targetUserId == null) {
            throw new RuntimeException("User ID is required to create a ticket");
        }

        final Integer finalUserId = targetUserId;
        User user = null;
        if (finalUserId != null) {
            user = userRepository.findById(finalUserId).orElse(null);
        }

        // Fallback 1: Match by email if provided
        if (user == null && ticket.getUser() != null && ticket.getUser().getEmail() != null) {
            user = userRepository.findByEmail(ticket.getUser().getEmail()).orElse(null);
        }

        // Fallback 2: Re-create user if email provided
        if (user == null && ticket.getUser() != null && ticket.getUser().getEmail() != null) {
            User newUser = new User();
            newUser.setFullName(ticket.getUser().getFullName() != null ? ticket.getUser().getFullName() : "Customer");
            newUser.setEmail(ticket.getUser().getEmail());
            newUser.setPassword("$2a$12$FallbackHashPasswordNotUsedDirectlyDemoCustomer1");
            newUser.setRole(User.Role.CUSTOMER);
            user = userRepository.save(newUser);
        }

        // Fallback 3: Fallback to existing customer or demo user
        if (user == null) {
            user = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.Role.CUSTOMER)
                    .findFirst()
                    .orElseGet(() -> userRepository.findAll().stream().findFirst()
                            .orElseThrow(() -> new RuntimeException("User not found with ID: " + finalUserId)));
        }

        ticket.setUser(user);
        if (ticket.getStatus() == null) {
            ticket.setStatus(Ticket.Status.OPEN);
        }
        if (ticket.getPriority() == null) {
            ticket.setPriority(Ticket.Priority.MEDIUM);
        }
        if (ticket.getCategory() == null || ticket.getCategory().isBlank()) {
            ticket.setCategory("General");
        }

        if (ticket.getAssignedTo() != null && ticket.getAssignedTo().getUserId() != null) {
            User agent = userRepository.findById(ticket.getAssignedTo().getUserId())
                    .orElse(null);
            ticket.setAssignedTo(agent);
        } else {
            ticket.setAssignedTo(null);
        }

        return ticketRepository.save(ticket);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<Ticket> getTicketById(Integer ticketId) {
        return ticketRepository.findById(ticketId);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getTicketsByUser(Integer userId) {
        return ticketRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getTicketsByAgent(Integer agentId) {
        return ticketRepository.findByAssignedTo_UserId(agentId);
    }

    @Transactional(readOnly = true)
    public List<Ticket> getTicketsByStatus(Ticket.Status status) {
        return ticketRepository.findByStatus(status);
    }

    public Ticket updateTicket(Integer ticketId, Ticket updated) {
        Ticket existing = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + ticketId));

        if (updated.getSubject() != null && !updated.getSubject().isBlank()) {
            existing.setSubject(updated.getSubject());
        }
        if (updated.getDescription() != null && !updated.getDescription().isBlank()) {
            existing.setDescription(updated.getDescription());
        }
        if (updated.getStatus() != null) {
            existing.setStatus(updated.getStatus());
        }
        if (updated.getPriority() != null) {
            existing.setPriority(updated.getPriority());
        }
        if (updated.getCategory() != null) {
            existing.setCategory(updated.getCategory());
        }
        if (updated.getAssignedTo() != null && updated.getAssignedTo().getUserId() != null) {
            User agent = userRepository.findById(updated.getAssignedTo().getUserId())
                    .orElse(null);
            existing.setAssignedTo(agent);
        }

        return ticketRepository.save(existing);
    }

    public Ticket updateStatus(Integer ticketId, Ticket.Status status) {
        Ticket existing = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found with ID: " + ticketId));
        existing.setStatus(status);
        return ticketRepository.save(existing);
    }

    public void deleteTicket(Integer ticketId) {
        if (!ticketRepository.existsById(ticketId)) {
            throw new RuntimeException("Ticket not found with ID: " + ticketId);
        }
        messageRepository.deleteByTicket_TicketId(ticketId);
        ticketRepository.deleteById(ticketId);
    }
}
