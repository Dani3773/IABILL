package com.projeto.assistant.dto;

import com.projeto.assistant.model.ChatMessage;
import com.projeto.assistant.model.ChatMessageRole;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ChatMessageResponseDTO(
        UUID id,
        ChatMessageRole role,
        String content,
        List<String> actionsTaken,
        Instant createdAt
) {
    public static ChatMessageResponseDTO fromEntity(ChatMessage m) {
        return new ChatMessageResponseDTO(m.getId(), m.getRole(), m.getContent(), m.getActionsTaken(), m.getCreatedAt());
    }
}