package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record VendorRequestDTO(
        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        UUID sectorId,

        @NotBlank(message = "O nome do fornecedor é obrigatório")
        String name,

        @NotBlank(message = "O serviço prestado é obrigatório")
        String serviceProvided,

        @NotBlank(message = "As categorias de dado compartilhado são obrigatórias")
        String sharedDataCategories,

        boolean dpaSigned,
        LocalDate dpaSignedAt,
        boolean securityClausesConfirmed,
        String observations
) {
}