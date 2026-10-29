package com.resolveai.backend.controller;

import com.resolveai.backend.entity.Message;
import com.resolveai.backend.service.MessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for per-ticket conversation messages.
 *
 * Base path: /api/messages
 */
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    /**
     * POST /api/messages
     * Post a new message to a ticket thread.
     */
    @PostMapping
    public ResponseEntity<Message> postMessage(@RequestBody Map<String, Object> body) {
        Object tId = body.get("ticketId");
        Object sId = body.get("senderId");
        Integer ticketId = tId != null ? Integer.valueOf(tId.toString()) : null;
        Integer senderId = sId != null ? Integer.valueOf(sId.toString()) : null;
        String  messageText = (String) body.get("messageText");

        if (ticketId == null || senderId == null || messageText == null || messageText.isBlank()) {
            throw new RuntimeException("ticketId, senderId, and messageText are required");
        }

        Message saved = messageService.postMessage(ticketId, senderId, messageText);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/messages/ticket/{ticketId}
     * Retrieve all messages for a ticket, ordered oldest-first.
     */
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<Message>> getMessagesByTicket(@PathVariable Integer ticketId) {
        return ResponseEntity.ok(messageService.getMessagesByTicket(ticketId));
    }

    /**
     * GET /api/messages
     * Retrieve all messages across tickets.
     */
    @GetMapping
    public ResponseEntity<List<Message>> getAllMessages() {
        return ResponseEntity.ok(messageService.getAllMessages());
    }
}
