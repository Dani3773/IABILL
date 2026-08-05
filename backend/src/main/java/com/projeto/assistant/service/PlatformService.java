package com.projeto.assistant.service;

import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.security.SecureRandom;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlatformService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<PlatformTenantSummaryDTO> listAllTenants() {

        return tenantRepository.findAllWithStats();
    }

    @Transactional(readOnly = true)
    public PlatformTenantDetailDTO getTenantDetail(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + tenantId));

        List<PlatformUserSummaryDTO> users = userRepository.findByTenantId(tenantId).stream()
                .map(u -> new PlatformUserSummaryDTO(u.getId(), u.getUsername(), u.getEmail(), u.getRole()))
                .toList();

        List<PlatformWorkspaceSummaryDTO> workspaces = workspaceRepository.findByTenantId(tenantId).stream()
                .map(w -> new PlatformWorkspaceSummaryDTO(w.getId(), w.getName(), w.getType(), w.getDocumentId()))
                .toList();

        return new PlatformTenantDetailDTO(
                tenant.getId(), tenant.getName(), tenant.getDocumentId(), tenant.getCountry(),
                tenant.getCreatedAt(), users, workspaces);
    }

    @Transactional
    public PlatformTenantDetailDTO updateTenant(UUID tenantId, PlatformTenantUpdateRequestDTO request, UUID authUserId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + tenantId));

        String before = tenant.getName() + " / " + tenant.getDocumentId() + " / " + tenant.getCountry();

        tenant.setName(request.name());
        tenant.setDocumentId(request.documentId());
        tenant.setCountry(request.country());
        tenantRepository.save(tenant);

        // Auditoria registrada NO TENANT AFETADO (nao no tenant do super-admin) -
        // garante transparencia: a propria empresa consegue ver, na sua trilha de
        // auditoria, que um administrador de plataforma editou seus dados.
        auditLogService.record(tenantId, authUserId, AuditAction.UPDATE, AuditEntityType.TENANT, tenantId,
                Map.of("before", before, "after", request.name() + " / " + request.documentId() + " / " + request.country()));

        return getTenantDetail(tenantId);
    }

    @Transactional
    public PlatformUserSummaryDTO updateUserRole(UUID userId, UserRole newRole, UUID authUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        UserRole previousRole = user.getRole();
        user.setRole(newRole);
        userRepository.save(user);

        // So registra na trilha de auditoria se o usuario pertence a um tenant real
        // (contas Super-Admin sem tenant nao tem onde registrar isso).
        if (user.getTenant() != null) {
            auditLogService.record(user.getTenant().getId(), authUserId, AuditAction.UPDATE, AuditEntityType.USER, userId,
                    Map.of("roleChange", previousRole + " -> " + newRole, "changedByPlatformAdmin", true));
        }

        return new PlatformUserSummaryDTO(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
    }

    @Transactional
    public PlatformPasswordResetResponseDTO resetUserPassword(UUID userId, UUID authUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));

        String temporaryPassword = generateTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        userRepository.save(user);

        // NUNCA registra a senha em texto puro na auditoria - so o fato de que
        // a acao aconteceu.
        if (user.getTenant() != null) {
            auditLogService.record(user.getTenant().getId(), authUserId, AuditAction.UPDATE, AuditEntityType.USER, userId,
                    Map.of("action", "senha resetada por administrador de plataforma"));
        }

        return new PlatformPasswordResetResponseDTO(temporaryPassword);
    }

    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}