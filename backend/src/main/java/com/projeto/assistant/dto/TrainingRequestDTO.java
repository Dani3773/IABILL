package com.projeto.assistant.dto;

import com.projeto.assistant.model.TrainingMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TrainingRequestDTO(
        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        @NotBlank(message = "O título é obrigatório")
        String title,

        String description,

        @NotNull(message = "O método é obrigatório")
        TrainingMethod method,

        @NotNull(message = "A data é obrigatória")
        LocalDate trainingDate,

        @NotEmpty(message = "Selecione ao menos um participante")
        List<UUID> attendeeIds
) {
}