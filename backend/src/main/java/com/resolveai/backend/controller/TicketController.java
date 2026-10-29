package com.resolveai.backend.controller;

import com.resolveai.backend.entity.Message;
import com.resolveai.backend.entity.Ticket;
import com.resolveai.backend.service.MessageService;
import com.resolveai.backend.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for support ticket operations.
 *
 * Base path: /api/tickets
 */
@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final MessageService messageService;

    public TicketController(TicketService ticketService, MessageService messageService) {
        this.ticketService = ticketService;
        this.messageService = messageService;
    }

    /**
     * POST /api/tickets
     * Create a new support ticket.
     */
    @PostMapping
    public ResponseEntity<Ticket> createTicket(@Valid @RequestBody Ticket ticket,
                                               @RequestParam(required = false) Integer userId) {
        Ticket created = ticketService.createTicket(ticket, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * GET /api/tickets
     * List all tickets, or filter by ?status=OPEN
     */
    @GetMapping
    public ResponseEntity<List<Ticket>> getAllTickets(@RequestParam(required = false) Ticket.Status status) {
        if (status != null) {
            return ResponseEntity.ok(ticketService.getTicketsByStatus(status));
        }
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    /**
     * GET /api/tickets/{id}
     * Get ticket by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Integer id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/tickets/user/{userId}
     * Get tickets created by a specific user.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Ticket>> getTicketsByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId));
    }

    /**
     * GET /api/tickets/agent/{agentId}
     * Get tickets assigned to an agent.
     */
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<Ticket>> getTicketsByAgent(@PathVariable Integer agentId) {
        return ResponseEntity.ok(ticketService.getTicketsByAgent(agentId));
    }

    /**
     * PUT /api/tickets/{id}
     * Update ticket details.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Ticket> updateTicket(@PathVariable Integer id,
                                               @RequestBody Ticket ticket) {
        return ResponseEntity.ok(ticketService.updateTicket(id, ticket));
    }

    /**
     * PATCH /api/tickets/{id}/status
     * Update ticket status (e.g. { "status": "IN_PROGRESS" }).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable Integer id,
                                               @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new RuntimeException("Status field is required");
        }
        Ticket.Status status = Ticket.Status.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(ticketService.updateStatus(id, status));
    }

    /**
     * DELETE /api/tickets/{id}
     * Delete a ticket and its associated messages.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable Integer id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/tickets/{id}/messages
     * Retrieve all messages belonging to this ticket.
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<List<Message>> getTicketMessages(@PathVariable Integer id) {
        return ResponseEntity.ok(messageService.getMessagesByTicket(id));
    }

    /**
     * POST /api/tickets/{id}/messages
     * Post a new message to this ticket thread directly.
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<Message> postTicketMessage(@PathVariable Integer id,
                                                     @RequestBody Map<String, Object> body) {
        Object sId = body.get("senderId");
        Integer senderId = sId != null ? Integer.valueOf(sId.toString()) : null;
        String messageText = (String) body.get("messageText");

        if (senderId == null || messageText == null || messageText.isBlank()) {
            throw new RuntimeException("senderId and messageText are required");
        }

        Message saved = messageService.postMessage(id, senderId, messageText);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
