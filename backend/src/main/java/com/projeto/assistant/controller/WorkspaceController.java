package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import org.springframework.web.bind.annotation.RequestAttribute;
import com.projeto.assistant.dto.WorkspaceRequestDTO;
import com.projeto.assistant.dto.WorkspaceResponseDTO;
import com.projeto.assistant.service.WorkspaceService;
import com.projeto.assistant.config.JwtAuthenticationFilter;
import org.springframework.web.bind.annotation.RequestAttribute;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public WorkspaceResponseDTO create(
            @Valid @RequestBody WorkspaceRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return workspaceService.create(request, authUserId);
    }

    @GetMapping
    public List<WorkspaceResponseDTO> findByTenant(@RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return workspaceService.findByTenant(authTenantId);
    }
}