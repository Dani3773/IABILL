package com.projeto.assistant.dto;

import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;

import java.time.Instant;
import java.util.UUID;

public record UserResponseDTO(
        UUID id,
        UUID tenantId,
        String username,
        String email,
        UserRole role,
        String jobTitle,
        String committeeRole,
        boolean dpoSubstitute,
        Instant createdAt
) {
    public static UserResponseDTO fromEntity(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getTenant().getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getJobTitle(),
                user.getCommitteeRole(),
                user.isDpoSubstitute(),
                user.getCreatedAt()
        );
    }
}