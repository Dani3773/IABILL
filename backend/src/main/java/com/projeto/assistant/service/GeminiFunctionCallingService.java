package com.projeto.assistant.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class GeminiFunctionCallingService {

    private final RestClient restClient;
    private final String apiKey;
    private final String generationModel;

    public GeminiFunctionCallingService(
            @Value("${gemini.base-url}") String baseUrl,
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.generation-model}") String generationModel) {

        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.generationModel = generationModel;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateWithTools(List<Map<String, Object>> contents, List<Map<String, Object>> functionDeclarations) {
        Map<String, Object> requestBody = Map.of(
                "contents", contents,
                "tools", List.of(Map.of("functionDeclarations", functionDeclarations))
        );

        Map<String, Object> response = restClient.post()
                .uri("/models/{model}:generateContent?key={key}", generationModel, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        return (Map<String, Object>) candidates.get(0).get("content");
    }
}