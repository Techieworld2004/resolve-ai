package com.resolveai.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Service to communicate with LLM Providers:
 * - Groq Cloud API (Llama 3.3 70B / Llama 3.1 8B)
 * - Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
 * - OpenAI API (gpt-4o-mini)
 * - Local / Ollama endpoints
 * Includes smart key auto-detection and resilient domain fallback.
 */
@Service
public class LlmService {

    private static final Logger log = LoggerFactory.getLogger(LlmService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${resolveai.llm.provider:groq}")
    private String defaultProvider;

    @Value("${resolveai.llm.groq-api-key:}")
    private String configuredGroqKey;

    @Value("${resolveai.llm.gemini-api-key:}")
    private String configuredGeminiKey;

    @Value("${resolveai.llm.openai-api-key:}")
    private String configuredOpenAiKey;

    @Value("${resolveai.llm.model:llama-3.3-70b-versatile}")
    private String defaultModel;

    @Value("${resolveai.llm.groq-endpoint:https://api.groq.com/openai/v1/chat/completions}")
    private String groqEndpoint;

    @Value("${resolveai.llm.openai-endpoint:https://api.openai.com/v1/chat/completions}")
    private String openAiEndpoint;

    public LlmService() {
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    /**
     * Call the LLM to generate a conversational customer support reply.
     *
     * @param userMessage  The customer's message/query
     * @param systemPrompt The domain context, guidelines, and user ticket data
     * @param clientApiKey Optional API key passed from frontend settings
     * @param provider     Optional provider ("groq", "gemini", "openai", "builtin")
     * @param model        Optional model name
     * @return LLM-generated response text, or null if LLM is unavailable/failed
     */
    public LlmResult generateReply(String userMessage,
                                   String systemPrompt,
                                   String clientApiKey,
                                   String provider,
                                   String model) {
        String activeKey = (clientApiKey != null && !clientApiKey.isBlank()) ? clientApiKey.trim() : null;
        String activeProvider = (provider != null && !provider.isBlank()) ? provider.toLowerCase().trim() : defaultProvider.toLowerCase().trim();
        String activeModel = (model != null && !model.isBlank()) ? model.trim() : defaultModel;

        // Auto-detect provider by key prefix if ambiguous
        if (activeKey != null) {
            if (activeKey.startsWith("gsk_")) {
                activeProvider = "groq";
            } else if (activeKey.startsWith("AIzaSy")) {
                activeProvider = "gemini";
            } else if (activeKey.startsWith("sk-")) {
                activeProvider = "openai";
            }
        }

        if ("builtin".equalsIgnoreCase(activeProvider) || "offline".equalsIgnoreCase(activeProvider)) {
            return null; // Signals caller to use the high-quality built-in autonomous engine
        }

        // 1. Try Groq Cloud (Ultra-fast LLM)
        if ("groq".equalsIgnoreCase(activeProvider)) {
            String apiKey = (activeKey != null) ? activeKey : configuredGroqKey;
            if (apiKey != null && !apiKey.isBlank()) {
                String resolvedModel = (activeModel != null && !activeModel.isBlank() && !activeModel.contains("gemini"))
                        ? activeModel
                        : defaultModel;
                if (resolvedModel == null || resolvedModel.isBlank() || resolvedModel.contains("llama")) {
                    resolvedModel = "openai/gpt-oss-120b";
                }

                try {
                    String text = callOpenAiCompatible(groqEndpoint, userMessage, systemPrompt, apiKey, resolvedModel);
                    if (text != null && !text.isBlank()) {
                        log.info("Successfully generated reply using Groq ({})", resolvedModel);
                        return new LlmResult(text, "groq", resolvedModel);
                    }
                } catch (Exception e) {
                    log.warn("Groq LLM call with [{}] failed: {}. Retrying with fallback model openai/gpt-oss-120b...", resolvedModel, e.getMessage());
                    if (!"openai/gpt-oss-120b".equalsIgnoreCase(resolvedModel)) {
                        try {
                            String text = callOpenAiCompatible(groqEndpoint, userMessage, systemPrompt, apiKey, "openai/gpt-oss-120b");
                            if (text != null && !text.isBlank()) {
                                log.info("Successfully generated reply using Groq fallback (openai/gpt-oss-120b)");
                                return new LlmResult(text, "groq", "openai/gpt-oss-120b");
                            }
                        } catch (Exception ex) {
                            log.warn("Groq fallback call also failed: {}", ex.getMessage());
                        }
                    }
                }
            } else {
                log.info("No Groq API key provided. Using built-in intelligent engine.");
            }
        }

        // 2. Try Gemini
        if ("gemini".equalsIgnoreCase(activeProvider)) {
            String apiKey = (activeKey != null) ? activeKey : configuredGeminiKey;
            if (apiKey != null && !apiKey.isBlank()) {
                try {
                    String resolvedModel = (activeModel == null || activeModel.isBlank() || activeModel.contains("llama") || activeModel.contains("gpt"))
                            ? "gemini-1.5-flash"
                            : activeModel;
                    String text = callGemini(userMessage, systemPrompt, apiKey, resolvedModel);
                    if (text != null && !text.isBlank()) {
                        log.info("Successfully generated reply using Gemini ({})", resolvedModel);
                        return new LlmResult(text, "gemini", resolvedModel);
                    }
                } catch (Exception e) {
                    log.warn("Gemini LLM call failed: {}. Falling back to domain logic.", e.getMessage());
                }
            } else {
                log.info("No Gemini API key provided. Using built-in intelligent engine.");
            }
        }

        // 3. Try OpenAI
        if ("openai".equalsIgnoreCase(activeProvider)) {
            String apiKey = (activeKey != null) ? activeKey : configuredOpenAiKey;
            if (apiKey != null && !apiKey.isBlank()) {
                try {
                    String resolvedModel = (activeModel == null || activeModel.isBlank() || activeModel.contains("llama") || activeModel.contains("gemini"))
                            ? "gpt-4o-mini"
                            : activeModel;
                    String text = callOpenAiCompatible(openAiEndpoint, userMessage, systemPrompt, apiKey, resolvedModel);
                    if (text != null && !text.isBlank()) {
                        log.info("Successfully generated reply using OpenAI ({})", resolvedModel);
                        return new LlmResult(text, "openai", resolvedModel);
                    }
                } catch (Exception e) {
                    log.warn("OpenAI LLM call failed: {}. Falling back to domain logic.", e.getMessage());
                }
            } else {
                log.info("No OpenAI API key provided. Using built-in intelligent engine.");
            }
        }

        return null;
    }

    /**
     * Invoke OpenAI-compatible REST API (works for Groq Cloud, OpenAI, Together, OpenRouter, and Ollama)
     */
    private String callOpenAiCompatible(String endpoint, String userMessage, String systemPrompt, String apiKey, String modelName) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("model", modelName);
        payload.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
        ));
        payload.put("temperature", 0.6);
        payload.put("max_tokens", 1200);

        String jsonBody = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("API error at {} (status {}): {}", endpoint, response.statusCode(), response.body());
            throw new RuntimeException("API returned HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            JsonNode msg = choices.get(0).path("message");
            String content = msg.path("content").asText("");
            if (!content.isBlank()) {
                return content;
            }
            String reasoning = msg.path("reasoning").asText("");
            if (!reasoning.isBlank()) {
                return reasoning;
            }
        }

        return null;
    }

    /**
     * Invoke Google Gemini REST API (v1beta)
     */
    private String callGemini(String userMessage, String systemPrompt, String apiKey, String modelName) throws Exception {
        String resolvedModel = (modelName == null || modelName.isBlank() || modelName.contains("gpt") || modelName.contains("llama")) ? "gemini-1.5-flash" : modelName;
        String endpointUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + resolvedModel + ":generateContent?key=" + apiKey;

        Map<String, Object> payload = new HashMap<>();

        Map<String, Object> systemInstruction = new HashMap<>();
        systemInstruction.put("parts", List.of(Map.of("text", systemPrompt)));
        payload.put("system_instruction", systemInstruction);

        Map<String, Object> userContent = new HashMap<>();
        userContent.put("role", "user");
        userContent.put("parts", List.of(Map.of("text", userMessage)));
        payload.put("contents", List.of(userContent));

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("temperature", 0.7);
        genConfig.put("maxOutputTokens", 1200);
        payload.put("generationConfig", genConfig);

        String jsonBody = objectMapper.writeValueAsString(payload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpointUrl))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("Gemini API error (status {}): {}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini returned HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && !parts.isEmpty()) {
                return parts.get(0).path("text").asText();
            }
        }

        return null;
    }

    /**
     * Retrieve current server-side configuration status.
     */
    public Map<String, Object> getConfigStatus() {
        Map<String, Object> config = new HashMap<>();
        config.put("defaultProvider", defaultProvider);
        config.put("defaultModel", defaultModel);
        config.put("groqKeyConfigured", configuredGroqKey != null && !configuredGroqKey.isBlank());
        config.put("geminiKeyConfigured", configuredGeminiKey != null && !configuredGeminiKey.isBlank());
        config.put("openAiKeyConfigured", configuredOpenAiKey != null && !configuredOpenAiKey.isBlank());
        config.put("availableProviders", List.of("groq", "gemini", "openai", "builtin"));
        config.put("status", "ACTIVE");
        return config;
    }

    public static class LlmResult {
        private final String text;
        private final String provider;
        private final String model;

        public LlmResult(String text, String provider, String model) {
            this.text = text;
            this.provider = provider;
            this.model = model;
        }

        public String getText() {
            return text;
        }

        public String getProvider() {
            return provider;
        }

        public String getModel() {
            return model;
        }
    }
}
