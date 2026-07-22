package com.projeto.assistant.controller;

import com.projeto.assistant.dto.WorkspaceRequestDTO;
import com.projeto.assistant.dto.WorkspaceResponseDTO;
import com.projeto.assistant.service.WorkspaceService;
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
    public WorkspaceResponseDTO create(@Valid @RequestBody WorkspaceRequestDTO request) {
        return workspaceService.create(request);
    }

    @GetMapping
    public List<WorkspaceResponseDTO> findByTenant(@RequestParam UUID tenantId) {
        return workspaceService.findByTenant(tenantId);
    }
}