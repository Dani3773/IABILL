package com.projeto.assistant.dto;

public record CepLookupResponseDTO(
        boolean found,
        String street,
        String neighborhood,
        String city,
        String state
) {
}