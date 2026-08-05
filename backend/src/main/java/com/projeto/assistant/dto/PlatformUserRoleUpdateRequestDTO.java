package com.projeto.assistant.dto;

import com.projeto.assistant.model.UserRole;
import jakarta.validation.constraints.NotNull;

public record PlatformUserRoleUpdateRequestDTO(
        @NotNull(message = "O papel é obrigatório")
        UserRole role
) {
}