package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.ComplianceSummaryDTO;
import com.projeto.assistant.service.ComplianceSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
public class ComplianceSummaryController {

    private final ComplianceSummaryService complianceSummaryService;

    @GetMapping("/{workspaceId}/compliance-summary")
    public ComplianceSummaryDTO getSummary(
            @PathVariable UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return complianceSummaryService.getSummary(workspaceId, authTenantId);
    }
}