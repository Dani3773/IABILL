package com.projeto.assistant.service;

import com.projeto.assistant.dto.AuditLogResponseDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.AuditLogRepository;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    // Metodo interno, chamado por OUTROS services (DocumentService, UserService, etc.)
    // quando uma acao relevante acontece - nunca chamado diretamente por um Controller.
    @Transactional
    public void record(UUID tenantId, UUID userId, AuditAction action, AuditEntityType entityType, UUID entityId, Map<String, Object> metadata) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + tenantId));

        AuditLog log = new AuditLog();
        log.setTenant(tenant);
        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
            log.setUser(user);
        }
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setMetadata(metadata);

        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> findByTenant(UUID tenantId) {
        return auditLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(AuditLogResponseDTO::fromEntity)
                .toList();
    }
}