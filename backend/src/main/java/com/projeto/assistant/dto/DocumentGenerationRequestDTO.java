package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public record DocumentGenerationRequestDTO(
        @NotBlank(message = "A instrução é obrigatória")
        String instruction
) {
}