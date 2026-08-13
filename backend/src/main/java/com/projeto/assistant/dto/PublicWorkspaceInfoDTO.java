package com.projeto.assistant.dto;

// Resposta publica minima - NUNCA expor mais do que o nome da empresa aqui,
// mesmo que o Workspace tenha outros campos. Endpoint sem autenticacao.
public record PublicWorkspaceInfoDTO(
        boolean found,
        String workspaceName
) {
}