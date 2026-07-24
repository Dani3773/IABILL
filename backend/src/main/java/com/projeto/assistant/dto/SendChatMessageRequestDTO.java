package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public record SendChatMessageRequestDTO(
        @NotBlank(message = "A mensagem é obrigatória")
        String message
) {
}