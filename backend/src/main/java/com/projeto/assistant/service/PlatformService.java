package com.projeto.assistant.service;

import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.validator.constraints.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlatformService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<PlatformTenantSummaryDTO> listAllTenants() {

        return tenantRepository.findAllWithStats();
    }

    @Transactional(readOnly = true)
    public PlatformTenantDetailDTO getTenantDetail(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + tenantId));

        List<PlatformUserSummaryDTO> users = userRepository.findByTenantId(tenantId).stream()
                .map(u -> new PlatformUserSummaryDTO(u.getId(), u.getUsername(), u.getEmail(), u.getRole()))
                .toList();

        List<PlatformWorkspaceSummaryDTO> workspaces = workspaceRepository.findByTenantId(tenantId).stream()
                .map(w -> new PlatformWorkspaceSummaryDTO(w.getId(), w.getName(), w.getType(), w.getDocumentId()))
                .toList();

        return new PlatformTenantDetailDTO(
                tenant.getId(), tenant.getName(), tenant.getDocumentId(), tenant.getCountry(),
                tenant.getCreatedAt(), users, workspaces);
    }

    @Transactional
    public PlatformTenantDetailDTO updateTenant(UUID tenantId, PlatformTenantUpdateRequestDTO request, UUID authUserId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + tenantId));

        String before = tenant.getName() + " / " + tenant.getDocumentId() + " / " + tenant.getCountry();

        tenant.setName(request.name());
        tenant.setDocumentId(request.documentId());
        tenant.setCountry(request.country());
        tenantRepository.save(tenant);

        // Auditoria registrada NO TENANT AFETADO (nao no tenant do super-admin) -
        // garante transparencia: a propria empresa consegue ver, na sua trilha de
        // auditoria, que um administrador de plataforma editou seus dados.
        auditLogService.record(tenantId, authUserId, AuditAction.UPDATE, AuditEntityType.TENANT, tenantId,
                Map.of("before", before, "after", request.name() + " / " + request.documentId() + " / " + request.country()));

        return getTenantDetail(tenantId);
    }
}