package com.projeto.assistant.controller;

import com.projeto.assistant.dto.TenantRequestDTO;
import com.projeto.assistant.dto.TenantResponseDTO;
import com.projeto.assistant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.projeto.assistant.config.JwtAuthenticationFilter;
import org.springframework.web.bind.annotation.RequestAttribute;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public TenantResponseDTO create(@Valid @RequestBody TenantRequestDTO request) {
        return tenantService.create(request);
    }

    @GetMapping("/me")
    public TenantResponseDTO findMyTenant(@RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return tenantService.findById(authTenantId);
    }
}