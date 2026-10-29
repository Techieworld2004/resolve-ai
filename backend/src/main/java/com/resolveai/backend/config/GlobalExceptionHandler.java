package com.resolveai.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralised exception handling for all REST controllers.
 * Every error response has a consistent shape:
 * {
 *   "timestamp": "...",
 *   "status":    400,
 *   "error":     "Bad Request",
 *   "message":   "...",
 *   "path":      "/api/..."
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle bean-validation failures (@Valid annotations on request bodies).
     * Returns 400 with a list of field-level error messages.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.toList());

        return buildResponse(HttpStatus.BAD_REQUEST,
                             String.join("; ", errors),
                             request.getRequestURI());
    }

    /**
     * Handle business-rule violations (e.g. duplicate email, not found).
     * Returns 400 Bad Request.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException ex, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST,
                             ex.getMessage(),
                             request.getRequestURI());
    }

    /**
     * Catch-all for unexpected exceptions.
     * Returns 500 Internal Server Error.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception ex, HttpServletRequest request) {
        String msg = (ex.getMessage() != null) ? ex.getMessage() : "An unexpected error occurred";
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, msg, request.getRequestURI());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status,
                                                              String message,
                                                              String path) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status",    status.value());
        body.put("error",     status.getReasonPhrase());
        body.put("message",   message);
        body.put("path",      path);
        return ResponseEntity.status(status).body(body);
    }
}
