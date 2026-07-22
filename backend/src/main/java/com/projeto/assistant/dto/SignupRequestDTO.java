package com.projeto.assistant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequestDTO(

        @NotBlank(message = "O nome da empresa é obrigatório")
        String tenantName,

        @NotBlank(message = "O documento (CNPJ/NIF) é obrigatório")
        String tenantDocumentId,

        @NotBlank(message = "O país é obrigatório")
        @Size(min = 2, max = 2, message = "Use o código ISO de 2 letras, ex: BR")
        String tenantCountry,

        @NotBlank(message = "O username é obrigatório")
        String adminUsername,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String adminEmail,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 8, message = "A senha deve ter no mínimo 8 caracteres")
        String adminPassword
) {
}