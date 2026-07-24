package com.projeto.assistant.dto;

import java.util.UUID;

public record AuthMeResponseDTO(
        UUID userId,
        UUID tenantId,
        String role
) {
}