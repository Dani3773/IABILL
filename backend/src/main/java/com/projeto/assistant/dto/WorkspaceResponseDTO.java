package com.projeto.assistant.dto;

import com.projeto.assistant.model.LegalRegime;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record WorkspaceResponseDTO(
        UUID id,
        UUID tenantId,
        String name,
        WorkspaceType type,
        String documentId,
        String country,
        String state,
        String city,
        String street,
        String addressNumber,
        String phone,
        Set<LegalRegime> legalRegimes,
        Instant createdAt
) {
    public static WorkspaceResponseDTO fromEntity(Workspace workspace) {
        return new WorkspaceResponseDTO(
                workspace.getId(),
                workspace.getTenant().getId(),
                workspace.getName(),
                workspace.getType(),
                workspace.getDocumentId(),
                workspace.getCountry(),
                workspace.getState(),
                workspace.getCity(),
                workspace.getStreet(),
                workspace.getAddressNumber(),
                workspace.getPhone(),
                workspace.getLegalRegimes(),
                workspace.getCreatedAt()
        );
    }
}