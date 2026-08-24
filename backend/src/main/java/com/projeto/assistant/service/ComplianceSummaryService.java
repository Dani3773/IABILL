package com.projeto.assistant.service;

import com.projeto.assistant.dto.ComplianceSummaryDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplianceSummaryService {

    private final WorkspaceRepository workspaceRepository;
    private final ProcessingActivityRepository processingActivityRepository;
    private final VendorRepository vendorRepository;
    private final EmployeeRepository employeeRepository;
    private final TrainingRepository trainingRepository;
    private final IncidentRepository incidentRepository;
    private final DocumentRepository documentRepository;
    private final DataSubjectRequestRepository dataSubjectRequestRepository;
    private final UserRepository userRepository;
    private final ConsentRecordRepository consentRecordRepository;

    @Transactional(readOnly = true)
    public ComplianceSummaryDTO getSummary(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        List<ProcessingActivity> activities = processingActivityRepository.findByWorkspaceId(workspaceId);
        int ropaCount = activities.size();

        List<ProcessingActivity> consentActivities = activities.stream()
                .filter(a -> a.getLegalBasis() == LegalBasis.CONSENTIMENTO)
                .toList();
        int consentActivitiesMissingProof = (int) consentActivities.stream()
                .filter(a -> consentRecordRepository.findByProcessingActivityIdOrderByConsentedAtDesc(a.getId()).isEmpty())
                .count();

        Instant nowForRetention = Instant.now();
        int retentionOverdueCount = (int) activities.stream()
                .filter(a -> a.getRetentionExpiresAt() != null
                        && a.getRetentionExpiresAt().isBefore(nowForRetention.atZone(java.time.ZoneId.systemDefault()).toLocalDate()))
                .count();

        List<Vendor> vendors = vendorRepository.findByWorkspaceId(workspaceId);
        int vendorsTotal = vendors.size();
        int vendorsWithDpa = (int) vendors.stream().filter(Vendor::isDpaSigned).count();

        List<Employee> employees = employeeRepository.findByWorkspaceId(workspaceId);
        int employeesActive = (int) employees.stream().filter(Employee::isActive).count();

        List<Training> trainings = trainingRepository.findByWorkspaceId(workspaceId);
        Set<UUID> trainedIds = trainings.stream()
                .flatMap(t -> t.getAttendees().stream())
                .map(Employee::getId)
                .collect(Collectors.toSet());

        List<Document> documents = documentRepository.findByWorkspaceId(workspaceId);
        Instant now = Instant.now();
        int documentsOverdue = (int) documents.stream()
                .filter(d -> d.getReviewDueAt() != null && d.getReviewDueAt().isBefore(now))
                .count();

        List<Incident> incidents = incidentRepository.findByWorkspaceId(workspaceId);
        int incidentsOpen = (int) incidents.stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED)
                .count();

        List<DataSubjectRequest> requests = dataSubjectRequestRepository.findByWorkspaceId(workspaceId);
        int dsrPending = (int) requests.stream()
                .filter(r -> r.getStatus() == DataSubjectRequestStatus.RECEIVED
                        || r.getStatus() == DataSubjectRequestStatus.IN_PROGRESS)
                .count();

        // DPO e escopado por Tenant, nao por Workspace (o mesmo Encarregado responde
        // por todos os workspaces da empresa) - por isso a busca aqui usa authTenantId,
        // nao workspaceId, diferente de todo o resto deste metodo.
        User dpo = userRepository.findByTenantId(authTenantId).stream()
                .filter(u -> u.getRole() == UserRole.DPO && !u.isDpoSubstitute())
                .findFirst()
                .orElse(null);

        return new ComplianceSummaryDTO(
                ropaCount, vendorsTotal, vendorsWithDpa, employeesActive,
                trainedIds.size(), documentsOverdue, incidentsOpen, dsrPending,
                dpo != null, dpo != null ? dpo.getUsername() : null,
                consentActivities.size(), consentActivitiesMissingProof, retentionOverdueCount
        );
    }
}