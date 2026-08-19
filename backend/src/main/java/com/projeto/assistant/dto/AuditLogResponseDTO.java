package com.projeto.assistant.dto;

import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.model.AuditLog;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponseDTO(
        UUID id,
        UUID tenantId,
        UUID userId,
        String username,
        AuditAction action,
        AuditEntityType entityType,
        UUID entityId,
        Map<String, Object> metadata,
        Instant createdAt
) {
    public static AuditLogResponseDTO fromEntity(AuditLog log) {
        return new AuditLogResponseDTO(
                log.getId(),
                log.getTenant().getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getUser() != null ? log.getUser().getUsername() : null,
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getMetadata(),
                log.getCreatedAt()
        );
    }
}