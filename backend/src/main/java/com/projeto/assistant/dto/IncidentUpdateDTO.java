package com.projeto.assistant.dto;

import com.projeto.assistant.model.IncidentSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record IncidentUpdateDTO(
        @NotBlank String description,
        @NotBlank String affectedDataCategories,
        Integer estimatedAffectedCount,
        @NotNull IncidentSeverity severity,
        String mitigationMeasures
) {
}