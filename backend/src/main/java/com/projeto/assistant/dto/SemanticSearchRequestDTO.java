package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SemanticSearchRequestDTO(
        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        @NotBlank(message = "A consulta é obrigatória")
        String query,

        Integer limit
) {
    public int limitOrDefault() {
        return (limit == null || limit <= 0) ? 5 : limit;
    }
}