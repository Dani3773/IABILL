package com.projeto.assistant.controller;

import com.projeto.assistant.service.GeminiEmbeddingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/gemini-test")
@RequiredArgsConstructor
public class GeminiTestController {

    private final GeminiEmbeddingService geminiEmbeddingService;

    @GetMapping("/embed")
    public Map<String, Object> testEmbed(@RequestParam String text) {
        float[] embedding = geminiEmbeddingService.embed(text);
        return Map.of(
                "dimension", embedding.length,
                "first5Values", java.util.Arrays.copyOfRange(boxArray(embedding), 0, 5)
        );
    }

    private Float[] boxArray(float[] arr) {
        Float[] boxed = new Float[arr.length];
        for (int i = 0; i < arr.length; i++) {
            boxed[i] = arr[i];
        }
        return boxed;
    }
}