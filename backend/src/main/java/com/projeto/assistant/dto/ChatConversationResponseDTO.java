package com.projeto.assistant.dto;

import com.projeto.assistant.model.ChatConversation;

import java.time.Instant;
import java.util.UUID;

public record ChatConversationResponseDTO(
        UUID id,
        String title,
        Instant createdAt,
        Instant updatedAt
) {
    public static ChatConversationResponseDTO fromEntity(ChatConversation c) {
        return new ChatConversationResponseDTO(c.getId(), c.getTitle(), c.getCreatedAt(), c.getUpdatedAt());
    }
}