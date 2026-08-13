package com.projeto.assistant.dto;

import com.projeto.assistant.model.LegalRegime;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record SignupRequestDTO(

        @NotBlank(message = "O nome da conta é obrigatório")
        String tenantName,

        @NotBlank(message = "O nome da empresa é obrigatório")
        String workspaceName,

        @NotBlank(message = "O documento (CNPJ/NIF) é obrigatório")
        String workspaceDocumentId,

        @NotBlank(message = "O país é obrigatório")
        @Size(min = 2, max = 2, message = "Use o código ISO de 2 letras, ex: BR")
        String workspaceCountry,

        String workspaceState,
        String workspaceCity,
        String workspaceStreet,
        String workspaceAddressNumber,
        String workspacePhone,

        @NotNull(message = "Ao menos um regime legal deve ser selecionado")
        Set<LegalRegime> workspaceLegalRegimes,

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