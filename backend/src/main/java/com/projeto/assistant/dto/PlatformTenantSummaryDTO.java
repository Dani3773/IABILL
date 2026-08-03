package com.projeto.assistant.dto;

import java.time.Instant;
import java.util.UUID;

public record PlatformTenantSummaryDTO(
        UUID id,
        String name,
        String documentId,
        String country,
        Instant createdAt,
        long userCount,
        long workspaceCount,
        long documentCount
) {
}