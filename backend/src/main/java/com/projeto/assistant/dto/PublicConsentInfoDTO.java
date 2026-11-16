package com.projeto.assistant.dto;

public record PublicConsentInfoDTO(
        boolean found,
        String workspaceName,
        String processName,
        String purpose,
        // Lei da atividade (LGPD ou RGPD), para o termo citar o artigo certo.
        String applicableRegime
) {
}