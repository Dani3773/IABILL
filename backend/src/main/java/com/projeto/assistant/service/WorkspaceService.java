package com.projeto.assistant.service;

import com.projeto.assistant.dto.WorkspaceRequestDTO;
import com.projeto.assistant.dto.WorkspaceResponseDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final TenantRepository tenantRepository;
    private final AuditLogService auditLogService;

    public WorkspaceResponseDTO create(WorkspaceRequestDTO request, UUID authUserId) {
        Tenant tenant = tenantRepository.findById(request.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + request.tenantId()));

        Workspace workspace = new Workspace();
        workspace.setTenant(tenant);
        workspace.setName(request.name());
        workspace.setType(request.type());
        workspace.setDocumentId(request.documentId());
        workspace.setCountry(request.country());
        workspace.setState(request.state());
        workspace.setCity(request.city());
        workspace.setNeighborhood(request.neighborhood());
        workspace.setPostalCode(request.postalCode());
        workspace.setStreet(request.street());
        workspace.setAddressNumber(request.addressNumber());
        workspace.setPhone(request.phone());
        workspace.setLegalRegimes(request.legalRegimes());

        Workspace saved = workspaceRepository.save(workspace);

        auditLogService.record(
                tenant.getId(),
                authUserId,
                AuditAction.CREATE,
                AuditEntityType.WORKSPACE,
                saved.getId(),
                Map.of("name", saved.getName(), "type", saved.getType().name())
        );

        return WorkspaceResponseDTO.fromEntity(saved);
    }

    public List<WorkspaceResponseDTO> findByTenant(UUID tenantId) {
        return workspaceRepository.findByTenantId(tenantId)
                .stream()
                .map(WorkspaceResponseDTO::fromEntity)
                .toList();
    }
}