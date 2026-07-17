package com.projeto.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TenantRequestDTO(

        @NotBlank(message = "O nome da empresa é obrigatório")
        String name,

        @NotBlank(message = "O documento (CNPJ/NIF) é obrigatório")
        @Size(max = 32)
        String documentId,

        @NotBlank(message = "O país é obrigatório")
        @Size(min = 2, max = 2, message = "Use o código ISO de 2 letras, ex: BR")
        String country
) {
}