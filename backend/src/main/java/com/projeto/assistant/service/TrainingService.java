package com.projeto.assistant.service;

import com.projeto.assistant.dto.TrainingRequestDTO;
import com.projeto.assistant.dto.TrainingResponseDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.EmployeeRepository;
import com.projeto.assistant.repository.TrainingRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final WorkspaceRepository workspaceRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public TrainingResponseDTO create(TrainingRequestDTO request, UUID authTenantId, UUID authUserId) {
        Workspace workspace = workspaceRepository.findById(request.workspaceId())
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + request.workspaceId()));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        Set<Employee> attendees = new HashSet<>(employeeRepository.findAllById(request.attendeeIds()));
        boolean hasForeignAttendee = attendees.stream()
                .anyMatch(employee -> !employee.getWorkspace().getId().equals(workspace.getId()));
        if (hasForeignAttendee) {
            throw new AccessDeniedException("Há participantes que não pertencem a este workspace");
        }

        Training training = new Training();
        training.setWorkspace(workspace);
        training.setTitle(request.title());
        training.setDescription(request.description());
        training.setMethod(request.method());
        training.setTrainingDate(request.trainingDate());
        training.setAttendees(attendees);
        training.setCreatedBy(authUserId);

        Training saved = trainingRepository.save(training);

        auditLogService.record(
                authTenantId, authUserId, AuditAction.CREATE, AuditEntityType.TRAINING,
                saved.getId(), Map.of("title", saved.getTitle(), "attendeeCount", attendees.size())
        );

        return TrainingResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<TrainingResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        return trainingRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(TrainingResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public void delete(UUID id, UUID authTenantId, UUID authUserId) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Treinamento não encontrado: " + id));

        if (!training.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este treinamento");
        }

        auditLogService.record(
                authTenantId, authUserId, AuditAction.DELETE, AuditEntityType.TRAINING,
                training.getId(), Map.of("title", training.getTitle())
        );

        trainingRepository.delete(training);
    }
}