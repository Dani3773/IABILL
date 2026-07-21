package com.projeto.assistant.service;

import com.projeto.assistant.dto.WorkspaceRequestDTO;
import com.projeto.assistant.dto.WorkspaceResponseDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final TenantRepository tenantRepository;

    public WorkspaceResponseDTO create(WorkspaceRequestDTO request) {
        Tenant tenant = tenantRepository.findById(request.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + request.tenantId()));

        Workspace workspace = new Workspace();
        workspace.setTenant(tenant);
        workspace.setName(request.name());
        workspace.setType(request.type());
        workspace.setDocumentId(request.documentId());

        Workspace saved = workspaceRepository.save(workspace);
        return WorkspaceResponseDTO.fromEntity(saved);
    }

    public List<WorkspaceResponseDTO> findByTenant(UUID tenantId) {
        return workspaceRepository.findByTenantId(tenantId)
                .stream()
                .map(WorkspaceResponseDTO::fromEntity)
                .toList();
    }
}