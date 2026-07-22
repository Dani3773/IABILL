package com.projeto.assistant.dto;

import com.projeto.assistant.model.DocumentStatus;

import java.util.UUID;

public record DocumentGenerationResponseDTO(
        UUID documentId,
        String generatedContent,
        DocumentStatus status
) {
}