package com.projeto.assistant.dto;

import com.projeto.assistant.model.LegalRegime;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// legalRegimes: regimes de todas as unidades da empresa juntos (o regime e
// definido por unidade; a empresa aparece como LGPD, RGPD ou as duas).
public record PlatformTenantSummaryDTO(
        UUID id,
        String name,
        String documentId,
        String country,
        Instant createdAt,
        long userCount,
        long workspaceCount,
        long documentCount,
        boolean active,
        List<LegalRegime> legalRegimes
) {
    // Usado pela consulta de contagens, que ainda nao conhece os regimes.
    public PlatformTenantSummaryDTO(UUID id, String name, String documentId, String country, Instant createdAt,
                                    long userCount, long workspaceCount, long documentCount, boolean active) {
        this(id, name, documentId, country, createdAt, userCount, workspaceCount, documentCount, active, List.of());
    }

    public PlatformTenantSummaryDTO withLegalRegimes(List<LegalRegime> regimes) {
        return new PlatformTenantSummaryDTO(id, name, documentId, country, createdAt,
                userCount, workspaceCount, documentCount, active, regimes);
    }
}
