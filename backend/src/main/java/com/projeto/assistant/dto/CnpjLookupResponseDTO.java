package com.projeto.assistant.dto;

public record CnpjLookupResponseDTO(
        boolean found,
        String name
) {
}