package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.AdequacyConfirmationResponseDTO;
import com.projeto.assistant.model.AdequacyItem;
import com.projeto.assistant.service.AdequacyConfirmationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/adequacy-confirmations")
@RequiredArgsConstructor
public class AdequacyConfirmationController {

    private final AdequacyConfirmationService confirmationService;

    @GetMapping
    public List<AdequacyConfirmationResponseDTO> findByWorkspace(
            @PathVariable UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return confirmationService.findByWorkspace(workspaceId, authTenantId);
    }

    @PutMapping("/{item}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public AdequacyConfirmationResponseDTO confirm(
            @PathVariable UUID workspaceId,
            @PathVariable AdequacyItem item,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return confirmationService.confirm(workspaceId, item, authTenantId, authUserId);
    }

    @DeleteMapping("/{item}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'DPO', 'SUPER_ADMIN')")
    public void revoke(
            @PathVariable UUID workspaceId,
            @PathVariable AdequacyItem item,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        confirmationService.revoke(workspaceId, item, authTenantId, authUserId);
    }
}
