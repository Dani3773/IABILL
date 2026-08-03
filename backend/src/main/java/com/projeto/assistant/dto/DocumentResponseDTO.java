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
        // createdBy pode ser null se o usuario que criou o documento foi
        // removido do sistema (ver migration V13 - ON DELETE SET NULL).
        // O documento continua valido mesmo sem essa referencia.
        UUID createdByUserId = document.getCreatedBy() != null
                ? document.getCreatedBy().getId()
                : null;

        return new DocumentResponseDTO(
                document.getId(),
                document.getWorkspace().getId(),
                createdByUserId,
                document.getType(),
                document.getTitle(),
                document.getStatus(),
                document.getGeneratedContent(),
                document.getCreatedAt()
        );
    }
}