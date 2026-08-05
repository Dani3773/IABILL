package com.projeto.assistant.dto;

import com.projeto.assistant.model.UserRole;

import java.util.UUID;

public record PlatformUserSummaryDTO(
        UUID id,
        String username,
        String email,
        UserRole role
) {
}