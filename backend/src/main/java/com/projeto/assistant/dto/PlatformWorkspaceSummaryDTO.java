package com.projeto.assistant.dto;

import com.projeto.assistant.model.WorkspaceType;

import java.util.UUID;

public record PlatformWorkspaceSummaryDTO(
        UUID id,
        String name,
        WorkspaceType type,
        String documentId
) {
}