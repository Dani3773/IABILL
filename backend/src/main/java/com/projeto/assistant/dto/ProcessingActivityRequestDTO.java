package com.projeto.assistant.dto;

import com.projeto.assistant.model.LegalBasis;
import com.projeto.assistant.model.LegalRegime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ProcessingActivityRequestDTO(
        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        UUID sectorId,

        @NotNull(message = "O regime legal aplicável é obrigatório")
        LegalRegime applicableRegime,

        @NotBlank(message = "O nome do processo é obrigatório")
        String processName,

        @NotBlank(message = "A finalidade é obrigatória")
        String purpose,

        @NotNull(message = "A hipótese legal é obrigatória")
        LegalBasis legalBasis,

        @NotBlank(message = "As categorias de titulares são obrigatórias")
        String dataSubjectCategories,

        @NotBlank(message = "As categorias de dados pessoais são obrigatórias")
        String personalDataCategories,

        String dataSharing,
        String securityMeasures,
        String retentionPeriod,
        boolean involvesSensitiveData,
        String observations
) {
}