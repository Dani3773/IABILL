package com.projeto.assistant.service;

import com.projeto.assistant.dto.AdequacyConfirmationResponseDTO;
import com.projeto.assistant.model.AdequacyConfirmation;
import com.projeto.assistant.model.AdequacyItem;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.AdequacyConfirmationRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdequacyConfirmationService {

    private final AdequacyConfirmationRepository confirmationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<AdequacyConfirmationResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        requireWorkspace(workspaceId, authTenantId);
        return confirmationRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(AdequacyConfirmationResponseDTO::fromEntity)
                .toList();
    }

    // Idempotente: confirmar de novo mantem quem confirmou primeiro e a data original.
    @Transactional
    public AdequacyConfirmationResponseDTO confirm(UUID workspaceId, AdequacyItem item, UUID authTenantId, UUID authUserId) {
        Workspace workspace = requireWorkspace(workspaceId, authTenantId);

        return confirmationRepository.findByWorkspaceIdAndItem(workspaceId, item)
                .map(AdequacyConfirmationResponseDTO::fromEntity)
                .orElseGet(() -> {
                    User user = userRepository.findById(authUserId)
                            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + authUserId));

                    AdequacyConfirmation confirmation = new AdequacyConfirmation();
                    confirmation.setWorkspace(workspace);
                    confirmation.setItem(item);
                    confirmation.setConfirmedBy(user);
                    AdequacyConfirmation saved = confirmationRepository.save(confirmation);

                    auditLogService.record(
                            authTenantId, authUserId, AuditAction.CREATE, AuditEntityType.ADEQUACY_CONFIRMATION,
                            saved.getId(), Map.of("item", item.name())
                    );
                    return AdequacyConfirmationResponseDTO.fromEntity(saved);
                });
    }

    @Transactional
    public void revoke(UUID workspaceId, AdequacyItem item, UUID authTenantId, UUID authUserId) {
        requireWorkspace(workspaceId, authTenantId);

        confirmationRepository.findByWorkspaceIdAndItem(workspaceId, item).ifPresent(confirmation -> {
            auditLogService.record(
                    authTenantId, authUserId, AuditAction.DELETE, AuditEntityType.ADEQUACY_CONFIRMATION,
                    confirmation.getId(), Map.of("item", item.name())
            );
            confirmationRepository.delete(confirmation);
        });
    }

    private Workspace requireWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }
        return workspace;
    }
}
