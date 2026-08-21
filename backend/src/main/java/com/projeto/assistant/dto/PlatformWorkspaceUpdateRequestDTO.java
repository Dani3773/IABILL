package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public record PlatformWorkspaceUpdateRequestDTO(
        @NotBlank(message = "O nome é obrigatório")
        String name,
        @NotBlank(message = "O CNPJ é obrigatório")
        String documentId,
        @NotBlank(message = "O país é obrigatório")
        String country
) {
}