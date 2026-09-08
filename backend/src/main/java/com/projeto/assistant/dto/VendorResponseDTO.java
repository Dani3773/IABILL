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
        boolean involvesInternationalTransfer,
        String destinationCountry,
        com.projeto.assistant.model.TransferSafeguard transferSafeguard,
        String transferSafeguardDetails,
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
                vendor.isInvolvesInternationalTransfer(),
                vendor.getDestinationCountry(),
                vendor.getTransferSafeguard(),
                vendor.getTransferSafeguardDetails(),
                vendor.getCreatedAt(),
                vendor.getUpdatedAt()
        );
    }
}