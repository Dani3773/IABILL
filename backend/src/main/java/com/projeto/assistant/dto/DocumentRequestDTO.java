package com.projeto.assistant.dto;

import com.projeto.assistant.model.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DocumentRequestDTO(

        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        @NotNull(message = "O usuário criador é obrigatório")
        UUID createdByUserId,

        @NotNull(message = "O tipo de documento é obrigatório")
        DocumentType type,

        @NotBlank(message = "O título é obrigatório")
        String title
) {
}