package com.projeto.assistant.dto;

// Representa uma sugestao da IA que AINDA NAO foi salva no banco -
// o usuario decide quais aprovar (human-in-the-loop desde a sugestao).
public record SuggestedActionItemDTO(
        String title,
        String description
) {
}