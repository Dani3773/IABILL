package com.projeto.assistant.dto;

import com.projeto.assistant.model.LegalRegime;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;

import java.util.List;
import java.util.UUID;

public record PlatformWorkspaceSummaryDTO(
        UUID id,
        String name,
        WorkspaceType type,
        String documentId,
        List<LegalRegime> legalRegimes
) {
    public static PlatformWorkspaceSummaryDTO fromEntity(Workspace w) {
        return new PlatformWorkspaceSummaryDTO(w.getId(), w.getName(), w.getType(), w.getDocumentId(),
                w.getLegalRegimes().stream().sorted().toList());
    }
}
