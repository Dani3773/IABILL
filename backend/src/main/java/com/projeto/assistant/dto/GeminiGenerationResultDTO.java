package com.projeto.assistant.dto;

public record GeminiGenerationResultDTO(
        String text,
        int promptTokenCount,
        int candidatesTokenCount,
        int totalTokenCount
) {
}