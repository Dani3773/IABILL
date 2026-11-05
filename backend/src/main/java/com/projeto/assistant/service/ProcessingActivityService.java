package com.projeto.assistant.service;

import com.projeto.assistant.dto.ProcessingActivityRequestDTO;
import com.projeto.assistant.dto.ProcessingActivityResponseDTO;
import com.projeto.assistant.model.ProcessingActivity;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.ProcessingActivityRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.repository.SectorRepository;
import com.projeto.assistant.model.Sector;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProcessingActivityService {

    private final ProcessingActivityRepository processingActivityRepository;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;
    private final SectorRepository sectorRepository;

    private Sector resolveSector(UUID sectorId, Workspace workspace) {
        if (sectorId == null) return null;
        Sector sector = sectorRepository.findById(sectorId).orElse(null);
        if (sector != null && !sector.getWorkspace().getId().equals(workspace.getId())) {
            throw new AccessDeniedException("O setor não pertence a este workspace");
        }
        return sector;
    }

    @Transactional
    public ProcessingActivityResponseDTO create(ProcessingActivityRequestDTO request, UUID authTenantId, UUID authUserId) {
        Workspace workspace = workspaceRepository.findById(request.workspaceId())
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + request.workspaceId()));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        ProcessingActivity activity = new ProcessingActivity();
        activity.setWorkspace(workspace);
        activity.setSector(resolveSector(request.sectorId(), workspace));
        activity.setApplicableRegime(request.applicableRegime());
        activity.setProcessName(request.processName());
        activity.setPurpose(request.purpose());
        activity.setLegalBasis(request.legalBasis());
        activity.setDataSubjectCategories(request.dataSubjectCategories());
        activity.setPersonalDataCategories(request.personalDataCategories());
        activity.setDataSharing(request.dataSharing());
        activity.setSecurityMeasures(request.securityMeasures());
        activity.setRetentionPeriod(request.retentionPeriod());
        activity.setRetentionExpiresAt(request.retentionExpiresAt());
        activity.setInvolvesSensitiveData(request.involvesSensitiveData());
        activity.setObservations(request.observations());
        activity.setCreatedBy(authUserId);

        ProcessingActivity saved = processingActivityRepository.save(activity);

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.CREATE,
                AuditEntityType.PROCESSING_ACTIVITY,
                saved.getId(),
                Map.of("processName", saved.getProcessName(), "legalBasis", saved.getLegalBasis().name())
        );

        return ProcessingActivityResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ProcessingActivityResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        return processingActivityRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(ProcessingActivityResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public ProcessingActivityResponseDTO update(UUID id, ProcessingActivityRequestDTO request, UUID authTenantId, UUID authUserId) {
        ProcessingActivity activity = processingActivityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atividade de tratamento não encontrada: " + id));

        if (!activity.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a esta atividade de tratamento");
        }

        activity.setSector(resolveSector(request.sectorId(), activity.getWorkspace()));
        activity.setApplicableRegime(request.applicableRegime());
        activity.setProcessName(request.processName());
        activity.setPurpose(request.purpose());
        activity.setLegalBasis(request.legalBasis());
        activity.setDataSubjectCategories(request.dataSubjectCategories());
        activity.setPersonalDataCategories(request.personalDataCategories());
        activity.setDataSharing(request.dataSharing());
        activity.setSecurityMeasures(request.securityMeasures());
        activity.setRetentionPeriod(request.retentionPeriod());
        activity.setRetentionExpiresAt(request.retentionExpiresAt());
        activity.setInvolvesSensitiveData(request.involvesSensitiveData());
        activity.setObservations(request.observations());

        ProcessingActivity saved = processingActivityRepository.save(activity);

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.UPDATE,
                AuditEntityType.PROCESSING_ACTIVITY,
                saved.getId(),
                Map.of("processName", saved.getProcessName())
        );

        return ProcessingActivityResponseDTO.fromEntity(saved);
    }

    @Transactional
    public void delete(UUID id, UUID authTenantId, UUID authUserId) {
        ProcessingActivity activity = processingActivityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atividade de tratamento não encontrada: " + id));

        if (!activity.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a esta atividade de tratamento");
        }

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.DELETE,
                AuditEntityType.PROCESSING_ACTIVITY,
                activity.getId(),
                Map.of("processName", activity.getProcessName())
        );

        processingActivityRepository.delete(activity);
    }

    @Transactional
    public ProcessingActivityResponseDTO dismissRipdSuggestion(UUID id, UUID authTenantId, UUID authUserId) {
        ProcessingActivity activity = processingActivityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atividade de tratamento não encontrada: " + id));

        if (!activity.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a esta atividade de tratamento");
        }

        activity.setRipdSuggestionDismissed(true);
        ProcessingActivity saved = processingActivityRepository.save(activity);

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.UPDATE,
                AuditEntityType.PROCESSING_ACTIVITY,
                saved.getId(),
                Map.of("action", "dismiss_ripd_suggestion")
        );

        return ProcessingActivityResponseDTO.fromEntity(saved);
    }
}