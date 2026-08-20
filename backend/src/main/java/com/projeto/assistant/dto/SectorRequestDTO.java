package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SectorRequestDTO(
        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        @NotBlank(message = "O nome do setor é obrigatório")
        String name
) {
}