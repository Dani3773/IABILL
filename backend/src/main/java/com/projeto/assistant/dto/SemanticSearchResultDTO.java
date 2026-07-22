package com.projeto.assistant.dto;

import java.util.UUID;

public record SemanticSearchResultDTO(
        UUID documentId,
        String documentTitle,
        int chunkIndex,
        String content
) {
}