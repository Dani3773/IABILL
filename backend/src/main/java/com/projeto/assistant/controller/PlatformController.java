package com.projeto.assistant.controller;

import com.projeto.assistant.dto.PlatformTenantSummaryDTO;
import com.projeto.assistant.service.PlatformService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}