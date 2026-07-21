package com.projeto.assistant.controller;

import com.projeto.assistant.dto.AuditLogResponseDTO;
import com.projeto.assistant.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    // Note: so GET. Sem POST/PUT/DELETE - reforca a imutabilidade do log tambem na API.
    @GetMapping
    public List<AuditLogResponseDTO> findByTenant(@RequestParam UUID tenantId) {
        return auditLogService.findByTenant(tenantId);
    }
}