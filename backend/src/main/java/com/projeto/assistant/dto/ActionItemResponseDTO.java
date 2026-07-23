package com.projeto.assistant.dto;

import com.projeto.assistant.model.ActionItem;
import com.projeto.assistant.model.ActionItemSource;
import com.projeto.assistant.model.ActionItemStatus;

import java.time.Instant;
import java.util.UUID;

public record ActionItemResponseDTO(
        UUID id,
        UUID workspaceId,
        String title,
        String description,
        ActionItemStatus status,
        ActionItemSource source,
        Instant createdAt
) {
    public static ActionItemResponseDTO fromEntity(ActionItem item) {
        return new ActionItemResponseDTO(
                item.getId(),
                item.getWorkspace().getId(),
                item.getTitle(),
                item.getDescription(),
                item.getStatus(),
                item.getSource(),
                item.getCreatedAt()
        );
    }
}