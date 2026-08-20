package com.projeto.assistant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ConsentSubmissionDTO(
        @NotBlank(message = "O nome é obrigatório")
        String consenterName,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "E-mail inválido")
        String consenterEmail
) {
}