package com.projeto.assistant.dto;

import com.projeto.assistant.model.Vendor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record VendorResponseDTO(
        UUID id,
        UUID workspaceId,
        UUID sectorId,
        String sectorName,
        String name,
        String serviceProvided,
        String sharedDataCategories,
        boolean dpaSigned,
        LocalDate dpaSignedAt,
        boolean securityClausesConfirmed,
        String observations,
        Instant createdAt,
        Instant updatedAt
) {
    public static VendorResponseDTO fromEntity(Vendor vendor) {
        return new VendorResponseDTO(
                vendor.getId(),
                vendor.getWorkspace().getId(),
                vendor.getSector() != null ? vendor.getSector().getId() : null,
                vendor.getSector() != null ? vendor.getSector().getName() : null,
                vendor.getName(),
                vendor.getServiceProvided(),
                vendor.getSharedDataCategories(),
                vendor.isDpaSigned(),
                vendor.getDpaSignedAt(),
                vendor.isSecurityClausesConfirmed(),
                vendor.getObservations(),
                vendor.getCreatedAt(),
                vendor.getUpdatedAt()
        );
    }
}