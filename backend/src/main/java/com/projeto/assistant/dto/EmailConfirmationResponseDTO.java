package com.projeto.assistant.dto;

public record EmailConfirmationResponseDTO(
        boolean success,
        String message
) {
}