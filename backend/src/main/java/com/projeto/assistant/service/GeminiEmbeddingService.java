package com.projeto.assistant.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class GeminiEmbeddingService {

    private final RestClient restClient;
    private final String apiKey;
    private final String embeddingModel;
    private final int embeddingDimension;

    public GeminiEmbeddingService(
            @Value("${gemini.base-url}") String baseUrl,
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.embedding-model}") String embeddingModel,
            @Value("${gemini.embedding-dimension}") int embeddingDimension) {

        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
        this.embeddingModel = embeddingModel;
        this.embeddingDimension = embeddingDimension;
    }

    @SuppressWarnings("unchecked")
    public float[] embed(String text) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY não configurada - defina a variável de ambiente");
        }

        Map<String, Object> requestBody = Map.of(
                "model", "models/" + embeddingModel,
                "content", Map.of("parts", List.of(Map.of("text", text))),
                "outputDimensionality", embeddingDimension
        );

        Map<String, Object> response = restClient.post()
                .uri("/models/{model}:embedContent?key={key}", embeddingModel, apiKey)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        Map<String, Object> embeddingObj = (Map<String, Object>) response.get("embedding");
        List<Double> values = (List<Double>) embeddingObj.get("values");

        float[] result = new float[values.size()];
        for (int i = 0; i < values.size(); i++) {
            result[i] = values.get(i).floatValue();
        }
        return result;
    }
}