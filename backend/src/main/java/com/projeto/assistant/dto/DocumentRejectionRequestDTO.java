package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public record DocumentRejectionRequestDTO(
        @NotBlank(message = "O motivo da rejeição é obrigatório")
        String reason
) {
}