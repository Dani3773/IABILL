package com.projeto.assistant.dto;

import com.projeto.assistant.model.Incident;
import com.projeto.assistant.model.IncidentSeverity;
import com.projeto.assistant.model.IncidentStatus;

import java.time.Instant;
import java.util.UUID;

public record IncidentResponseDTO(
        UUID id,
        UUID workspaceId,
        String title,
        String description,
        String affectedDataCategories,
        Integer estimatedAffectedCount,
        IncidentSeverity severity,
        IncidentStatus status,
        Instant discoveredAt,
        Instant occurredAt,
        Instant anpdNotifiedAt,
        Instant dataSubjectsNotifiedAt,
        String mitigationMeasures,
        Instant createdAt,
        Instant updatedAt
) {
    public static IncidentResponseDTO fromEntity(Incident incident) {
        return new IncidentResponseDTO(
                incident.getId(),
                incident.getWorkspace().getId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getAffectedDataCategories(),
                incident.getEstimatedAffectedCount(),
                incident.getSeverity(),
                incident.getStatus(),
                incident.getDiscoveredAt(),
                incident.getOccurredAt(),
                incident.getAnpdNotifiedAt(),
                incident.getDataSubjectsNotifiedAt(),
                incident.getMitigationMeasures(),
                incident.getCreatedAt(),
                incident.getUpdatedAt()
        );
    }
}