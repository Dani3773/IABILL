package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChatRequestDTO(
        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        @NotBlank(message = "A mensagem é obrigatória")
        String message
) {
}