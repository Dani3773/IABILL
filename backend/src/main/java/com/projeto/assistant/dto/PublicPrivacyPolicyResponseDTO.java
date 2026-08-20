package com.projeto.assistant.dto;

import java.time.Instant;

public record PublicPrivacyPolicyResponseDTO(
        boolean found,
        String workspaceName,
        String content,
        Instant publishedAt
) {
}