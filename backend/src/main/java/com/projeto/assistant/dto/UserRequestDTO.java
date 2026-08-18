package com.projeto.assistant.dto;

import com.projeto.assistant.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UserRequestDTO(

        @NotNull(message = "O tenant é obrigatório")
        UUID tenantId,

        @NotBlank(message = "O username é obrigatório")
        String username,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        @NotNull(message = "O papel (role) é obrigatório")
        UserRole role,

        String jobTitle,
        String committeeRole
) {
}