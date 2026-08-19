package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.VendorRequestDTO;
import com.projeto.assistant.dto.VendorResponseDTO;
import com.projeto.assistant.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VendorResponseDTO create(
            @Valid @RequestBody VendorRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return vendorService.create(request, authTenantId, authUserId);
    }

    @GetMapping("/workspace/{workspaceId}")
    public List<VendorResponseDTO> findByWorkspace(
            @PathVariable UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return vendorService.findByWorkspace(workspaceId, authTenantId);
    }

    @PutMapping("/{id}")
    public VendorResponseDTO update(
            @PathVariable UUID id,
            @Valid @RequestBody VendorRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return vendorService.update(id, request, authTenantId, authUserId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID id,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        vendorService.delete(id, authTenantId, authUserId);
    }
}