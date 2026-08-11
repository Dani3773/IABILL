package com.projeto.assistant.service;

import com.projeto.assistant.dto.IncidentRequestDTO;
import com.projeto.assistant.dto.IncidentResponseDTO;
import com.projeto.assistant.dto.IncidentUpdateDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.IncidentRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public IncidentResponseDTO create(IncidentRequestDTO request, UUID authTenantId, UUID authUserId) {
        Workspace workspace = getValidatedWorkspace(request.workspaceId(), authTenantId);

        Incident incident = new Incident();
        incident.setWorkspace(workspace);
        incident.setTitle(request.title());
        incident.setDescription(request.description());
        incident.setAffectedDataCategories(request.affectedDataCategories());
        incident.setEstimatedAffectedCount(request.estimatedAffectedCount());
        incident.setSeverity(request.severity());
        incident.setMitigationMeasures(request.mitigationMeasures());
        if (request.discoveredAt() != null) incident.setDiscoveredAt(request.discoveredAt());
        incident.setOccurredAt(request.occurredAt());

        Incident saved = incidentRepository.save(incident);

        auditLogService.record(authTenantId, authUserId, AuditAction.CREATE, AuditEntityType.INCIDENT, saved.getId(),
                Map.of("title", saved.getTitle(), "severity", saved.getSeverity().name()));

        return IncidentResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        getValidatedWorkspace(workspaceId, authTenantId);

        return incidentRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(IncidentResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public IncidentResponseDTO updateDetails(UUID id, IncidentUpdateDTO request, UUID authTenantId, UUID authUserId) {
        Incident incident = getValidatedIncident(id, authTenantId);

        incident.setDescription(request.description());
        incident.setAffectedDataCategories(request.affectedDataCategories());
        incident.setEstimatedAffectedCount(request.estimatedAffectedCount());
        incident.setSeverity(request.severity());
        incident.setMitigationMeasures(request.mitigationMeasures());

        Incident saved = incidentRepository.save(incident);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.INCIDENT, id,
                Map.of("field", "details"));

        return IncidentResponseDTO.fromEntity(saved);
    }

    @Transactional
    public IncidentResponseDTO updateStatus(UUID id, IncidentStatus newStatus, UUID authTenantId, UUID authUserId) {
        Incident incident = getValidatedIncident(id, authTenantId);

        IncidentStatus previous = incident.getStatus();
        incident.setStatus(newStatus);
        Incident saved = incidentRepository.save(incident);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.INCIDENT, id,
                Map.of("statusChange", previous + " -> " + newStatus));

        return IncidentResponseDTO.fromEntity(saved);
    }

    // Registra a notificacao formal a ANPD (Art. 48 LGPD). Marca o timestamp exato
    // e avanca o status - acao juridicamente significativa, por isso separada do
    // updateStatus generico (fica registrada na auditoria como um evento proprio,
    // com o timestamp de notificacao preservado mesmo que o status mude depois).
    @Transactional
    public IncidentResponseDTO notifyAnpd(UUID id, UUID authTenantId, UUID authUserId) {
        Incident incident = getValidatedIncident(id, authTenantId);

        incident.setAnpdNotifiedAt(Instant.now());
        incident.setStatus(IncidentStatus.ANPD_NOTIFIED);
        Incident saved = incidentRepository.save(incident);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.INCIDENT, id,
                Map.of("event", "anpd_notified"));

        return IncidentResponseDTO.fromEntity(saved);
    }

    // Registra a notificacao aos titulares afetados (segunda obrigacao distinta do Art. 48,
    // separada da notificacao a ANPD - podem acontecer em momentos diferentes).
    @Transactional
    public IncidentResponseDTO notifyDataSubjects(UUID id, UUID authTenantId, UUID authUserId) {
        Incident incident = getValidatedIncident(id, authTenantId);

        incident.setDataSubjectsNotifiedAt(Instant.now());
        incident.setStatus(IncidentStatus.DATA_SUBJECTS_NOTIFIED);
        Incident saved = incidentRepository.save(incident);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.INCIDENT, id,
                Map.of("event", "data_subjects_notified"));

        return IncidentResponseDTO.fromEntity(saved);
    }

    private Incident getValidatedIncident(UUID id, UUID authTenantId) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incidente não encontrado: " + id));

        if (!incident.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este incidente");
        }

        return incident;
    }

    private Workspace getValidatedWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        return workspace;
    }
}