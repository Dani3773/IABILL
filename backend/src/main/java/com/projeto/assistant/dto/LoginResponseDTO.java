package com.projeto.assistant.dto;

import java.util.UUID;

public record LoginResponseDTO(
        String token,
        UUID userId,
        UUID tenantId,
        String role,
        String username,
        String email
) {
}