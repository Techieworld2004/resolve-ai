package com.resolveai.backend.controller;

import com.resolveai.backend.entity.Message;
import com.resolveai.backend.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for ResolveAI intelligent assistant services.
 * Base path: /api/ai
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) { body = Map.of(); }
        String message = (String) body.get("message");
        Integer userId = parseUserId(body.get("userId"));
        String apiKey = (String) body.get("apiKey");
        String provider = (String) body.get("provider");
        String model = (String) body.get("model");
        return ResponseEntity.ok(aiService.processChat(message, userId, apiKey, provider, model));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        return ResponseEntity.ok(aiService.getConfigStatus());
    }

    @GetMapping("/suggest-reply/{ticketId}")
    public ResponseEntity<Map<String, Object>> suggestReply(@PathVariable Integer ticketId, @RequestParam(required = false) String apiKey, @RequestParam(required = false) String provider, @RequestParam(required = false) String model) {
        return ResponseEntity.ok(aiService.suggestTicketReply(ticketId, apiKey, provider, model));
    }

    @PostMapping("/suggest-reply/{ticketId}")
    public ResponseEntity<Map<String, Object>> suggestReplyPost(@PathVariable Integer ticketId, @RequestBody(required = false) Map<String, String> body) {
        String apiKey = body != null ? body.get("apiKey") : null;
        String provider = body != null ? body.get("provider") : null;
        String model = body != null ? body.get("model") : null;
        return ResponseEntity.ok(aiService.suggestTicketReply(ticketId, apiKey, provider, model));
    }

    @PostMapping("/ticket-assist/{ticketId}")
    public ResponseEntity<Message> autoAssistTicket(@PathVariable Integer ticketId, @RequestBody(required = false) Map<String, String> body) {
        String apiKey = body != null ? body.get("apiKey") : null;
        String provider = body != null ? body.get("provider") : null;
        String model = body != null ? body.get("model") : null;
        return ResponseEntity.ok(aiService.autoAssistTicketThread(ticketId, apiKey, provider, model));
    }

    @PostMapping("/ticket-reply/{ticketId}")
    public ResponseEntity<Message> replyTicketWithAi(@PathVariable Integer ticketId, @RequestBody Map<String, String> body) {
        String userMessage = body != null ? body.get("message") : "";
        String apiKey = body != null ? body.get("apiKey") : null;
        String provider = body != null ? body.get("provider") : null;
        String model = body != null ? body.get("model") : null;
        return ResponseEntity.ok(aiService.replyToTicketWithAi(ticketId, userMessage, apiKey, provider, model));
    }

    private Integer parseUserId(Object uId) {
        if (uId == null) return null;
        String str = uId.toString().trim();
        if (str.isEmpty() || "null".equalsIgnoreCase(str) || "undefined".equalsIgnoreCase(str)) return null;
        try { return Integer.valueOf(str); } catch (NumberFormatException e) { return null; }
    }
}
