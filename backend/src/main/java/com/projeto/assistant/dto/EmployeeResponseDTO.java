package com.projeto.assistant.dto;

import com.projeto.assistant.model.Employee;

import java.time.Instant;
import java.util.UUID;

public record EmployeeResponseDTO(
        UUID id,
        UUID workspaceId,
        String name,
        String jobTitle,
        UUID sectorId,
        String sectorName,
        String email,
        boolean active,
        Instant createdAt
) {
    public static EmployeeResponseDTO fromEntity(Employee employee) {
        return new EmployeeResponseDTO(
                employee.getId(),
                employee.getWorkspace().getId(),
                employee.getName(),
                employee.getJobTitle(),
                employee.getSector() != null ? employee.getSector().getId() : null,
                employee.getSector() != null ? employee.getSector().getName() : null,
                employee.getEmail(),
                employee.isActive(),
                employee.getCreatedAt()
        );
    }
}