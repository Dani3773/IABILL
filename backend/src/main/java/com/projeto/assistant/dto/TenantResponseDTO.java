package com.projeto.assistant.dto;

import com.projeto.assistant.model.Tenant;

import java.time.Instant;
import java.util.UUID;

public record TenantResponseDTO(
        UUID id,
        String name,
        String documentId,
        String country,
        Instant createdAt
) {
    public static TenantResponseDTO fromEntity(Tenant tenant) {
        return new TenantResponseDTO(
                tenant.getId(),
                tenant.getName(),
                tenant.getDocumentId(),
                tenant.getCountry(),
                tenant.getCreatedAt()
        );
    }
}