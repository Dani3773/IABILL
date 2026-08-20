package com.projeto.assistant.service;

import com.projeto.assistant.dto.SectorRequestDTO;
import com.projeto.assistant.dto.SectorResponseDTO;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.model.Sector;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.SectorRepository;
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
public class SectorService {

    private final SectorRepository sectorRepository;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public SectorResponseDTO create(SectorRequestDTO request, UUID authTenantId, UUID authUserId) {
        Workspace workspace = workspaceRepository.findById(request.workspaceId())
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + request.workspaceId()));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        Sector sector = new Sector();
        sector.setWorkspace(workspace);
        sector.setName(request.name());

        Sector saved = sectorRepository.save(sector);

        auditLogService.record(
                authTenantId, authUserId, AuditAction.CREATE, AuditEntityType.SECTOR,
                saved.getId(), Map.of("name", saved.getName())
        );

        return SectorResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<SectorResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        return sectorRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(SectorResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public void delete(UUID id, UUID authTenantId, UUID authUserId) {
        Sector sector = sectorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Setor não encontrado: " + id));

        if (!sector.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este setor");
        }

        auditLogService.record(
                authTenantId, authUserId, AuditAction.DELETE, AuditEntityType.SECTOR,
                sector.getId(), Map.of("name", sector.getName())
        );

        sectorRepository.delete(sector);
    }
}