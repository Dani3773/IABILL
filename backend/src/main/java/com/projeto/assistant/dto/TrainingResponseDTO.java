package com.projeto.assistant.dto;

import com.projeto.assistant.model.Training;
import com.projeto.assistant.model.TrainingMethod;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TrainingResponseDTO(
        UUID id,
        UUID workspaceId,
        String title,
        String description,
        TrainingMethod method,
        LocalDate trainingDate,
        List<EmployeeResponseDTO> attendees,
        Instant createdAt
) {
    public static TrainingResponseDTO fromEntity(Training training) {
        return new TrainingResponseDTO(
                training.getId(),
                training.getWorkspace().getId(),
                training.getTitle(),
                training.getDescription(),
                training.getMethod(),
                training.getTrainingDate(),
                training.getAttendees().stream().map(EmployeeResponseDTO::fromEntity).toList(),
                training.getCreatedAt()
        );
    }
}