package com.projeto.assistant.dto;

import com.projeto.assistant.model.WorkspaceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record WorkspaceRequestDTO(

        @NotNull(message = "O tenant é obrigatório")
        UUID tenantId,

        @NotBlank(message = "O nome do workspace é obrigatório")
        String name,

        @NotNull(message = "O tipo (MATRIZ/FILIAL) é obrigatório")
        WorkspaceType type,

        @NotBlank(message = "O documento (CNPJ) é obrigatório")
        @Size(max = 32)
        String documentId
) {
}