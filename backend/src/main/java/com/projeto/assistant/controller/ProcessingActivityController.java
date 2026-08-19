package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.ProcessingActivityRequestDTO;
import com.projeto.assistant.dto.ProcessingActivityResponseDTO;
import com.projeto.assistant.service.ProcessingActivityService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/processing-activities")
@RequiredArgsConstructor
public class ProcessingActivityController {

    private final ProcessingActivityService processingActivityService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public ProcessingActivityResponseDTO create(
            @Valid @RequestBody ProcessingActivityRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return processingActivityService.create(request, authTenantId, authUserId);
    }

    @GetMapping("/workspace/{workspaceId}")
    public List<ProcessingActivityResponseDTO> findByWorkspace(
            @PathVariable UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return processingActivityService.findByWorkspace(workspaceId, authTenantId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public ProcessingActivityResponseDTO update(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessingActivityRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return processingActivityService.update(id, request, authTenantId, authUserId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public void delete(
            @PathVariable UUID id,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        processingActivityService.delete(id, authTenantId, authUserId);
    }

    @PutMapping("/{id}/dismiss-ripd-suggestion")
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public ProcessingActivityResponseDTO dismissRipdSuggestion(
            @PathVariable UUID id,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return processingActivityService.dismissRipdSuggestion(id, authTenantId, authUserId);
    }
}