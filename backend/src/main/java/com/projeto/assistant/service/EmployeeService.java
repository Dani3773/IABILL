package com.projeto.assistant.service;

import com.projeto.assistant.dto.EmployeeRequestDTO;
import com.projeto.assistant.dto.EmployeeResponseDTO;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.model.Employee;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.EmployeeRepository;
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
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public EmployeeResponseDTO create(EmployeeRequestDTO request, UUID authTenantId, UUID authUserId) {
        Workspace workspace = workspaceRepository.findById(request.workspaceId())
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + request.workspaceId()));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        Employee employee = new Employee();
        employee.setWorkspace(workspace);
        employee.setName(request.name());
        employee.setJobTitle(request.jobTitle());
        employee.setDepartment(request.department());
        employee.setEmail(request.email());
        employee.setActive(request.active());
        employee.setCreatedBy(authUserId);

        Employee saved = employeeRepository.save(employee);

        auditLogService.record(
                authTenantId, authUserId, AuditAction.CREATE, AuditEntityType.EMPLOYEE,
                saved.getId(), Map.of("name", saved.getName())
        );

        return EmployeeResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        return employeeRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(EmployeeResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public EmployeeResponseDTO update(UUID id, EmployeeRequestDTO request, UUID authTenantId, UUID authUserId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Colaborador não encontrado: " + id));

        if (!employee.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este colaborador");
        }

        employee.setName(request.name());
        employee.setJobTitle(request.jobTitle());
        employee.setDepartment(request.department());
        employee.setEmail(request.email());
        employee.setActive(request.active());

        Employee saved = employeeRepository.save(employee);

        auditLogService.record(
                authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.EMPLOYEE,
                saved.getId(), Map.of("name", saved.getName())
        );

        return EmployeeResponseDTO.fromEntity(saved);
    }

    @Transactional
    public void delete(UUID id, UUID authTenantId, UUID authUserId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Colaborador não encontrado: " + id));

        if (!employee.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este colaborador");
        }

        auditLogService.record(
                authTenantId, authUserId, AuditAction.DELETE, AuditEntityType.EMPLOYEE,
                employee.getId(), Map.of("name", employee.getName())
        );

        employeeRepository.delete(employee);
    }
}