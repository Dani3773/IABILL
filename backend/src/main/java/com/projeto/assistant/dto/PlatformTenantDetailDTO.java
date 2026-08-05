package com.projeto.assistant.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PlatformTenantDetailDTO(
        UUID id,
        String name,
        String documentId,
        String country,
        Instant createdAt,
        List<PlatformUserSummaryDTO> users,
        List<PlatformWorkspaceSummaryDTO> workspaces
) {
}