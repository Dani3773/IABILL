package com.projeto.assistant.service;

import com.projeto.assistant.dto.GeminiGenerationResultDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class GeminiGenerationService {

    private final RestClient restClient;
    private final String apiKey;
    private final String generationModel;

    public GeminiGenerationService(
            @Value("${gemini.base-url}") String baseUrl,
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.generation-model}") String generationModel) {

        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.generationModel = generationModel;
    }

    @SuppressWarnings("unchecked")
    public GeminiGenerationResultDTO generate(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY não configurada");
        }

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                )
        );

        Map<String, Object> response = restClient.post()
                .uri("/models/{model}:generateContent?key={key}", generationModel, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        String text = (String) parts.get(0).get("text");

        // Consumo de tokens - a propria API do Gemini ja retorna isso em cada
        // resposta (campo usageMetadata), usado para a metrica "consumo de
        // tokens" pedida pelo orientador. Extracao defensiva - se o campo nao
        // vier por algum motivo, retorna 0 em vez de quebrar a geracao.
        Map<String, Object> usageMetadata = (Map<String, Object>) response.get("usageMetadata");
        int promptTokens = extractTokenCount(usageMetadata, "promptTokenCount");
        int candidatesTokens = extractTokenCount(usageMetadata, "candidatesTokenCount");
        int totalTokens = extractTokenCount(usageMetadata, "totalTokenCount");

        return new GeminiGenerationResultDTO(text, promptTokens, candidatesTokens, totalTokens);
    }

    private int extractTokenCount(Map<String, Object> usageMetadata, String key) {
        if (usageMetadata == null || usageMetadata.get(key) == null) {
            return 0;
        }
        return ((Number) usageMetadata.get(key)).intValue();
    }
}