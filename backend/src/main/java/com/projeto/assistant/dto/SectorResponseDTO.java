package com.projeto.assistant.dto;

import com.projeto.assistant.model.Sector;

import java.time.Instant;
import java.util.UUID;

public record SectorResponseDTO(
        UUID id,
        UUID workspaceId,
        String name,
        Instant createdAt
) {
    public static SectorResponseDTO fromEntity(Sector sector) {
        return new SectorResponseDTO(
                sector.getId(),
                sector.getWorkspace().getId(),
                sector.getName(),
                sector.getCreatedAt()
        );
    }
}