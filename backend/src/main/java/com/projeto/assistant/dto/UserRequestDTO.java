package com.projeto.assistant.dto;

import com.projeto.assistant.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UserRequestDTO(

        @NotNull(message = "O tenant é obrigatório")
        UUID tenantId,

        @NotBlank(message = "O username é obrigatório")
        String username,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
        String password,

        @NotNull(message = "O papel (role) é obrigatório")
        UserRole role
) {
}