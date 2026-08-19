package com.projeto.assistant.dto;

public record LoginResultDTO(
        boolean mfaRequired,
        LoginResponseDTO loginResponse
) {
}