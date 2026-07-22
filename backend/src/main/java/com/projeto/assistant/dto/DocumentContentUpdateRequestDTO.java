package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public record DocumentContentUpdateRequestDTO(
        @NotBlank(message = "O conteúdo é obrigatório")
        String content
) {
}