package com.projeto.assistant.dto;

import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.DocumentStatus;
import com.projeto.assistant.model.DocumentType;

import java.time.Instant;
import java.util.UUID;

public record DocumentResponseDTO(
        UUID id,
        UUID workspaceId,
        UUID createdByUserId,
        DocumentType type,
        String title,
        DocumentStatus status,
        String generatedContent,
        Instant createdAt
) {
    public static DocumentResponseDTO fromEntity(Document document) {
        return new DocumentResponseDTO(
                document.getId(),
                document.getWorkspace().getId(),
                document.getCreatedBy().getId(),
                document.getType(),
                document.getTitle(),
                document.getStatus(),
                document.getGeneratedContent(),
                document.getCreatedAt()
        );
    }
}