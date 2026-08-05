package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.PlatformTenantDetailDTO;
import com.projeto.assistant.dto.PlatformTenantSummaryDTO;
import com.projeto.assistant.dto.PlatformTenantUpdateRequestDTO;
import com.projeto.assistant.service.PlatformService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.hibernate.validator.constraints.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/platform")
@RequiredArgsConstructor
public class PlatformController {

    private final PlatformService platformService;

    @GetMapping("/tenants")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<PlatformTenantSummaryDTO> listAllTenants() {

        return platformService.listAllTenants();
    }

    @GetMapping("/tenants/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PlatformTenantDetailDTO getTenantDetail(@PathVariable UUID id) {
        return platformService.getTenantDetail(id);
    }

    @PutMapping("/tenants/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PlatformTenantDetailDTO updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody PlatformTenantUpdateRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return platformService.updateTenant(id, request, authUserId);
    }
}