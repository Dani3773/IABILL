package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record EmployeeRequestDTO(
        @NotNull(message = "O workspace é obrigatório")
        UUID workspaceId,

        @NotBlank(message = "O nome é obrigatório")
        String name,

        String jobTitle,
        UUID sectorId,
        String email,
        boolean active
) {
}