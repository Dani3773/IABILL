package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;

public record PlatformTenantUpdateRequestDTO(
        @NotBlank(message = "O nome é obrigatório")
        String name
) {
}