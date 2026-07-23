package com.projeto.assistant.dto;

import java.util.List;

public record ChatResponseDTO(
        String reply,
        List<String> actionsTaken
) {
}