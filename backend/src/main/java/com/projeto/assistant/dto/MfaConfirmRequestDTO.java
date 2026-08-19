package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotNull;

public record MfaConfirmRequestDTO(
        @NotNull(message = "O código é obrigatório")
        Integer code
) {
}