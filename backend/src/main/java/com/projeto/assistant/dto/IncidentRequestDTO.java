package com.projeto.assistant.dto;

import com.projeto.assistant.model.IncidentSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record IncidentRequestDTO(
        @NotNull UUID workspaceId,
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String affectedDataCategories,
        Integer estimatedAffectedCount,
        @NotNull IncidentSeverity severity,
        Instant discoveredAt,
        Instant occurredAt,
        String mitigationMeasures
) {
}