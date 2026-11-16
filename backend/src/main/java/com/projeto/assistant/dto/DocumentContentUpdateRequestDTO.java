package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public record DocumentContentUpdateRequestDTO(
        @NotBlank(message = "O conteúdo é obrigatório")
        String content,
        // "PDF" quando o texto veio de um PDF lido no navegador; vazio = digitado.
        String source,
        @jakarta.validation.constraints.Size(max = 255)
        String fileName
) {
}