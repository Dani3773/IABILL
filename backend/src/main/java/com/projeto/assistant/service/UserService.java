package com.projeto.assistant.service;

import com.projeto.assistant.config.MessageCatalog;
import com.projeto.assistant.dto.UserRequestDTO;
import com.projeto.assistant.dto.UserResponseDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.dto.WorkspaceMembershipResponseDTO;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.WorkspaceRepository;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.dto.UserActivationRequestDTO;
import com.projeto.assistant.dto.EmailConfirmationResponseDTO;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    @Transactional
    public UserResponseDTO create(UserRequestDTO request, UUID authUserId) {
        // Papel e tenant de quem cria vem do banco, nunca da requisicao: o cadastro
        // publico gera ADMIN, entao confiar no corpo permitiria a qualquer conta
        // virar SUPER_ADMIN ou criar usuarios dentro de outra organizacao.
        User creator = userRepository.findById(authUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + authUserId));
        boolean creatorIsPlatformAdmin = creator.getRole() == UserRole.SUPER_ADMIN;

        if (request.role() == UserRole.SUPER_ADMIN && !creatorIsPlatformAdmin) {
            throw new AccessDeniedException("Somente um Super-Administrador pode criar outro Super-Administrador");
        }

        // Super-Admin nao tem tenant proprio e por isso escolhe o destino no corpo;
        // os demais papeis so criam usuarios no proprio tenant.
        UUID targetTenantId = creatorIsPlatformAdmin ? request.tenantId() : creator.getTenant().getId();
        Tenant tenant = tenantRepository.findById(targetTenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + targetTenantId));

        String invitationToken = generateToken();

        User user = new User();
        user.setTenant(tenant);
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setJobTitle(request.jobTitle());
        user.setCommitteeRole(request.committeeRole());
        // So faz sentido marcar substituto quando o papel escolhido e DPO - ignora
        // silenciosamente se vier true para qualquer outro papel, em vez de lancar erro.
        user.setDpoSubstitute(Boolean.TRUE.equals(request.dpoSubstitute()) && request.role() == com.projeto.assistant.model.UserRole.DPO);
        // Senha temporaria aleatoria, inutilizavel - ninguem (nem o ADMIN que convidou)
        // sabe esse valor. O usuario convidado define a senha real na ativacao.
        user.setPasswordHash(passwordEncoder.encode(generateToken()));
        user.setRole(request.role());
        user.setEmailVerified(false);
        user.setEmailVerificationToken(invitationToken);
        user.setEmailVerificationExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));

        User saved = userRepository.save(user);

        auditLogService.record(
                tenant.getId(),
                authUserId,
                AuditAction.CREATE,
                AuditEntityType.USER,
                saved.getId(),
                Map.of("username", saved.getUsername(), "role", saved.getRole().name())
        );

        emailService.sendUserInvitation(saved.getEmail(), saved.getUsername(), tenant.getName(), invitationToken);

        return UserResponseDTO.fromEntity(saved);
    }

    @Transactional
    public EmailConfirmationResponseDTO activateAccount(UserActivationRequestDTO request) {
        User user = userRepository.findByEmailVerificationToken(request.token())
                .orElse(null);

        if (user == null) {
            return new EmailConfirmationResponseDTO(false, MessageCatalog.t("Link de convite inválido."));
        }

        if (user.getEmailVerificationExpiresAt() != null
                && user.getEmailVerificationExpiresAt().isBefore(Instant.now())) {
            return new EmailConfirmationResponseDTO(false, MessageCatalog.t("Link de convite expirado. Peça ao administrador para reenviar o convite."));
        }

        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);

        return new EmailConfirmationResponseDTO(true, MessageCatalog.t("Conta ativada com sucesso."));
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> findByTenant(UUID tenantId) {
        return userRepository.findByTenantId(tenantId)
                .stream()
                .map(UserResponseDTO::fromEntity)
                .toList();
    }

    // Super-Admin atua em qualquer tenant; os demais papeis so no proprio. O papel vem
    // do banco porque o Super-Admin nao tem tenant no token para comparar.
    private void assertTenantAccess(User target, UUID authUserId) {
        User requester = userRepository.findById(authUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + authUserId));

        if (requester.getRole() == UserRole.SUPER_ADMIN) {
            return;
        }
        if (target.getTenant() == null || !target.getTenant().getId().equals(requester.getTenant().getId())) {
            throw new AccessDeniedException("Você não tem acesso a este usuário");
        }
    }

    @Transactional(readOnly = true)
    public UserResponseDTO findById(UUID id, UUID authUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + id));
        assertTenantAccess(user, authUserId);
        return UserResponseDTO.fromEntity(user);
    }

    @Transactional
    public void addUserToWorkspace(UUID userId, UUID workspaceId, UUID authUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        assertTenantAccess(user, authUserId);

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (user.getTenant() == null || !workspace.getTenant().getId().equals(user.getTenant().getId())) {
            throw new AccessDeniedException("O workspace não pertence ao tenant deste usuário");
        }

        user.getWorkspaces().add(workspace);

        auditLogService.record(
                user.getTenant().getId(),
                authUserId,
                AuditAction.UPDATE,
                AuditEntityType.USER,
                userId,
                Map.of("action", "vinculado ao workspace", "workspaceId", workspaceId.toString())
        );

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMembershipResponseDTO> findWorkspacesOfUser(UUID userId, UUID authUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        assertTenantAccess(user, authUserId);

        return user.getWorkspaces()
                .stream()
                .map(WorkspaceMembershipResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public UserResponseDTO toggleDpoSubstitute(UUID userId, UUID authTenantId, UUID authUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        if (user.getTenant() == null || !user.getTenant().getId().equals(authTenantId)) {
            throw new org.springframework.security.access.AccessDeniedException("Você não tem acesso a este usuário");
        }
        if (user.getRole() != com.projeto.assistant.model.UserRole.DPO) {
            throw new IllegalArgumentException("Somente usuários com papel DPO podem ser marcados como substituto");
        }
        user.setDpoSubstitute(!user.isDpoSubstitute());
        User saved = userRepository.save(user);
        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.UPDATE,
                AuditEntityType.USER,
                userId,
                Map.of("dpoSubstitute", saved.isDpoSubstitute())
        );
        return UserResponseDTO.fromEntity(saved);
    }
}