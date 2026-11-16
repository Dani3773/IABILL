package com.projeto.assistant.dto;

import com.projeto.assistant.model.LegalRegime;

import java.util.List;

// Resposta publica minima - NUNCA expor mais do que o nome da empresa e a lei
// aplicavel aqui, mesmo que o Workspace tenha outros campos. Endpoint sem
// autenticacao. A lei aplicavel e informacao publica (aparece em qualquer aviso
// de privacidade) e decide quais direitos o portal cita.
public record PublicWorkspaceInfoDTO(
        boolean found,
        String workspaceName,
        List<LegalRegime> legalRegimes
) {
}