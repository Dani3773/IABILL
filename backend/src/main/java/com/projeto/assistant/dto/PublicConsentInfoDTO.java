package com.projeto.assistant.dto;

public record PublicConsentInfoDTO(
        boolean found,
        String workspaceName,
        String processName,
        String purpose
) {
}