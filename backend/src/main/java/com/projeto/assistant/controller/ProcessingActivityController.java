package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.ProcessingActivityRequestDTO;
import com.projeto.assistant.dto.ProcessingActivityResponseDTO;
import com.projeto.assistant.service.ProcessingActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/processing-activities")
@RequiredArgsConstructor
public class ProcessingActivityController {

    private final ProcessingActivityService processingActivityService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
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
    public ProcessingActivityResponseDTO update(
            @PathVariable UUID id,
            @Valid @RequestBody ProcessingActivityRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return processingActivityService.update(id, request, authTenantId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        processingActivityService.delete(id, authTenantId);
    }
}