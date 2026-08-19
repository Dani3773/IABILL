package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MfaVerifyRequestDTO(
        @NotBlank(message = "O e-mail é obrigatório")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        String password,

        @NotNull(message = "O código é obrigatório")
        Integer code
) {
}