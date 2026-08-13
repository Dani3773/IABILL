package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.*;
import com.projeto.assistant.service.DataSubjectRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DataSubjectRequestController {

    private final DataSubjectRequestService dataSubjectRequestService;

    // Endpoints publicos (sem autenticacao) - portal do titular
    @GetMapping("/api/v1/public/workspaces/{documentId}")
    public PublicWorkspaceInfoDTO lookupWorkspace(@PathVariable String documentId) {
        return dataSubjectRequestService.lookupWorkspaceByDocumentId(documentId);
    }

    @PostMapping("/api/v1/public/workspaces/{documentId}/data-subject-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public DataSubjectRequestResponseDTO submit(
            @PathVariable String documentId,
            @Valid @RequestBody DataSubjectRequestSubmissionDTO request) {
        return dataSubjectRequestService.submit(documentId, request);
    }

    // Endpoints autenticados - gestao pela empresa
    @GetMapping("/api/v1/data-subject-requests")
    public List<DataSubjectRequestResponseDTO> findByWorkspace(
            @RequestParam UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return dataSubjectRequestService.findByWorkspace(workspaceId, authTenantId);
    }

    @PutMapping("/api/v1/data-subject-requests/{id}/status")
    public DataSubjectRequestResponseDTO updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody DataSubjectRequestStatusUpdateDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return dataSubjectRequestService.updateStatus(id, request, authTenantId, authUserId);
    }
}