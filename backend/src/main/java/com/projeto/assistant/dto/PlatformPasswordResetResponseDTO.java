package com.projeto.assistant.dto;

// temporaryPassword so aparece UMA VEZ, nesta resposta - nunca fica
// recuperavel depois (nem para o proprio Super-Admin), ja que so o hash
// e persistido no banco. Precisa ser comunicada manualmente ao usuario.
public record PlatformPasswordResetResponseDTO(
        String temporaryPassword
) {
}