package com.projeto.assistant.service;

import com.projeto.assistant.dto.AuditLogResponseDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.AuditLogRepository;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.dto.AuditLogResponseDTO;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

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

    @Transactional(readOnly = true)
    public void exportToCsv(UUID tenantId, HttpServletResponse response) throws java.io.IOException {
        List<AuditLogResponseDTO> logs = findByTenant(tenantId);

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"trilha-auditoria.csv\"");
        // BOM UTF-8 - evita acentuacao quebrada ao abrir o CSV direto no Excel,
        // que por padrao assume Latin-1 sem esse marcador.
        response.getOutputStream().write(0xEF);
        response.getOutputStream().write(0xBB);
        response.getOutputStream().write(0xBF);

        PrintWriter writer = new PrintWriter(response.getOutputStream(), true, StandardCharsets.UTF_8);
        writer.println("Data,Usuário,Ação,Tipo de Entidade,ID da Entidade,Detalhes");

        for (AuditLogResponseDTO log : logs) {
            String username = log.username() != null ? log.username() : "Sistema";
            String metadata = log.metadata() != null ? log.metadata().toString() : "";
            writer.println(String.join(",",
                    csvEscape(log.createdAt().toString()),
                    csvEscape(username),
                    csvEscape(log.action().name()),
                    csvEscape(log.entityType().name()),
                    csvEscape(log.entityId().toString()),
                    csvEscape(metadata)
            ));
        }

        writer.flush();
    }

    // Escapa campos com virgula, aspas ou quebra de linha, seguindo a regra padrao
    // do formato CSV (RFC 4180) - envolve em aspas duplas e duplica aspas internas.
    private String csvEscape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}