package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.IncidentRequestDTO;
import com.projeto.assistant.dto.IncidentResponseDTO;
import com.projeto.assistant.dto.IncidentUpdateDTO;
import com.projeto.assistant.model.IncidentStatus;
import com.projeto.assistant.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    // Registro de incidente e uma acao sensivel - restrita a quem tem responsabilidade
    // formal sobre conformidade (ADMIN, DPO) ou administracao de plataforma.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public IncidentResponseDTO create(
            @Valid @RequestBody IncidentRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return incidentService.create(request, authTenantId, authUserId);
    }

    // Visualizacao aberta a qualquer membro autenticado do tenant (mesmo padrao do
    // ActionItem) - todos no workspace devem poder ver que um incidente existe.
    @GetMapping
    public List<IncidentResponseDTO> findByWorkspace(
            @RequestParam UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return incidentService.findByWorkspace(workspaceId, authTenantId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public IncidentResponseDTO updateDetails(
            @PathVariable UUID id,
            @Valid @RequestBody IncidentUpdateDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return incidentService.updateDetails(id, request, authTenantId, authUserId);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public IncidentResponseDTO updateStatus(
            @PathVariable UUID id,
            @RequestParam IncidentStatus status,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return incidentService.updateStatus(id, status, authTenantId, authUserId);
    }

    @PostMapping("/{id}/notify-anpd")
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public IncidentResponseDTO notifyAnpd(
            @PathVariable UUID id,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return incidentService.notifyAnpd(id, authTenantId, authUserId);
    }

    @PostMapping("/{id}/notify-data-subjects")
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public IncidentResponseDTO notifyDataSubjects(
            @PathVariable UUID id,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return incidentService.notifyDataSubjects(id, authTenantId, authUserId);
    }
}