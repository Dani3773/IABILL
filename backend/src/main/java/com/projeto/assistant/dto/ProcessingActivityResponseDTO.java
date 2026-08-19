package com.projeto.assistant.dto;

import com.projeto.assistant.model.LegalBasis;
import com.projeto.assistant.model.ProcessingActivity;

import java.time.Instant;
import java.util.UUID;

public record ProcessingActivityResponseDTO(
        UUID id,
        UUID workspaceId,
        String processName,
        String purpose,
        LegalBasis legalBasis,
        String dataSubjectCategories,
        String personalDataCategories,
        String dataSharing,
        String securityMeasures,
        String retentionPeriod,
        boolean involvesSensitiveData,
        String observations,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProcessingActivityResponseDTO fromEntity(ProcessingActivity activity) {
        return new ProcessingActivityResponseDTO(
                activity.getId(),
                activity.getWorkspace().getId(),
                activity.getProcessName(),
                activity.getPurpose(),
                activity.getLegalBasis(),
                activity.getDataSubjectCategories(),
                activity.getPersonalDataCategories(),
                activity.getDataSharing(),
                activity.getSecurityMeasures(),
                activity.getRetentionPeriod(),
                activity.isInvolvesSensitiveData(),
                activity.getObservations(),
                activity.getCreatedAt(),
                activity.getUpdatedAt()
        );
    }
}