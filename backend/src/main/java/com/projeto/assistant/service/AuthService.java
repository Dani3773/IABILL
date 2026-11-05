package com.projeto.assistant.service;

import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.projeto.assistant.repository.WorkspaceRepository workspaceRepository;
    private final EmailService emailService;
    private final MfaService mfaService;
    private final RateLimiterService rateLimiterService;

    // Cria o Tenant (conta), o primeiro Workspace (a empresa de verdade, com CNPJ/
    // endereco/regime legal) e o primeiro usuario (ADMIN), tudo de forma atomica, e
    // ja retorna logado. Este e o UNICO endpoint publico que cria dados no sistema.
    //
    // NOTA (13/08/2026): Tenant.documentId e Tenant.country nao sao mais preenchidos
    // aqui - esses dados agora pertencem ao Workspace, que e a entidade legal real
    // (uma conta/Tenant pode ter varios Workspaces, cada um com seu proprio CNPJ).
    // As colunas antigas continuam existindo no banco por seguranca, mas ficam nulas
    // para contas novas a partir de agora.
    @Transactional
    public SignupResponseDTO signup(SignupRequestDTO request) {
        Tenant tenant = new Tenant();
        tenant.setName(request.tenantName());
        Tenant savedTenant = tenantRepository.save(tenant);

        Workspace workspace = new Workspace();
        workspace.setTenant(savedTenant);
        workspace.setName(request.workspaceName());
        workspace.setType(WorkspaceType.MATRIZ);
        workspace.setDocumentId(request.workspaceDocumentId());
        workspace.setCountry(request.workspaceCountry());
        workspace.setState(request.workspaceState());
        workspace.setCity(request.workspaceCity());
        workspace.setNeighborhood(request.workspaceNeighborhood());
        workspace.setPostalCode(request.workspacePostalCode());
        workspace.setStreet(request.workspaceStreet());
        workspace.setAddressNumber(request.workspaceAddressNumber());
        workspace.setPhone(request.workspacePhone());
        workspace.setLegalRegimes(request.workspaceLegalRegimes());
        workspaceRepository.save(workspace);

        String verificationToken = generateToken();

        User user = new User();
        user.setTenant(savedTenant);
        user.setUsername(request.adminUsername());
        user.setEmail(request.adminEmail());
        user.setPasswordHash(passwordEncoder.encode(request.adminPassword()));
        user.setRole(UserRole.ADMIN);
        user.setEmailVerified(false);
        user.setEmailVerificationToken(verificationToken);
        user.setEmailVerificationExpiresAt(Instant.now().plus(48, ChronoUnit.HOURS));
        User savedUser = userRepository.save(user);

        emailService.sendEmailConfirmation(savedUser.getEmail(), savedUser.getUsername(), verificationToken);

        return new SignupResponseDTO(true, "Conta criada. Verifique seu e-mail para confirmar e poder entrar.");
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Transactional(readOnly = true)
    public LoginResultDTO login(LoginRequestDTO request) {
        User matchedUser = findAndValidateCredentials(request.email(), request.password());

        // Se a conta tem MFA ativada, NAO emite token ainda - o frontend precisa
        // chamar /login/mfa com o codigo TOTP antes do cookie ser gerado.
        if (matchedUser.isMfaEnabled()) {
            return new LoginResultDTO(true, null);
        }

        return new LoginResultDTO(false, buildLoginResponse(matchedUser));
    }

    @Transactional(readOnly = true)
    public LoginResponseDTO loginWithMfa(MfaVerifyRequestDTO request) {
        User matchedUser = findAndValidateCredentials(request.email(), request.password());

        if (!matchedUser.isMfaEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta conta não tem MFA habilitada.");
        }

        if (!mfaService.verifyCode(matchedUser, request.code())) {
            rateLimiterService.recordFailedLogin(request.email());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Código de verificação inválido.");
        }

        return buildLoginResponse(matchedUser);
    }

    // Centraliza a validacao de credenciais + confirmacao de e-mail, reaproveitada
    // tanto pelo login normal quanto pelo login com MFA (segunda etapa).
    private User findAndValidateCredentials(String email, String password) {
        rateLimiterService.checkLoginAllowed(email);

        List<User> candidates = userRepository.findByEmail(email);
        User matchedUser = candidates.stream()
                .filter(u -> passwordEncoder.matches(password, u.getPasswordHash()))
                .findFirst()
                .orElseThrow(() -> {
                    rateLimiterService.recordFailedLogin(email);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
                });

        if (!matchedUser.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
        }

        return matchedUser;
    }

    private LoginResponseDTO buildLoginResponse(User user) {
        rateLimiterService.clearFailedLogins(user.getEmail());
        UUID tenantId = user.getTenant() != null ? user.getTenant().getId() : null;
        String token = jwtService.generateToken(user.getId(), tenantId, user.getRole().name());
        return new LoginResponseDTO(token, user.getId(), tenantId, user.getRole().name(),
                user.getUsername(), user.getEmail());
    }

    @Transactional
    public EmailConfirmationResponseDTO resendConfirmation(LoginRequestDTO request) {
        List<User> candidates = userRepository.findByEmail(request.email());

        User matchedUser = candidates.stream()
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));

        if (matchedUser.isEmailVerified()) {
            return new EmailConfirmationResponseDTO(false, "Este e-mail já está confirmado.");
        }

        String newToken = generateToken();
        matchedUser.setEmailVerificationToken(newToken);
        matchedUser.setEmailVerificationExpiresAt(Instant.now().plus(48, ChronoUnit.HOURS));
        userRepository.save(matchedUser);

        emailService.sendEmailConfirmation(matchedUser.getEmail(), matchedUser.getUsername(), newToken);

        return new EmailConfirmationResponseDTO(true, "E-mail de confirmação reenviado.");
    }

    @Transactional
    public EmailConfirmationResponseDTO confirmEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElse(null);

        if (user == null) {
            return new EmailConfirmationResponseDTO(false, "Link de confirmação inválido.");
        }

        if (user.getEmailVerificationExpiresAt() != null
                && user.getEmailVerificationExpiresAt().isBefore(Instant.now())) {
            return new EmailConfirmationResponseDTO(false, "Link de confirmação expirado.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);

        return new EmailConfirmationResponseDTO(true, "E-mail confirmado com sucesso.");
    }

    @Transactional
    public EmailConfirmationResponseDTO forgotPassword(ForgotPasswordRequestDTO request) {
        List<User> candidates = userRepository.findByEmail(request.email());

        // Um e-mail de reset separado por CADA conta que tiver esse endereco -
        // nao da pra adivinhar qual conta a pessoa quer resetar, entao cada
        // e-mail identifica a empresa correspondente, e a pessoa escolhe o link certo.
        for (User user : candidates) {
            String token = generateToken();
            user.setPasswordResetToken(token);
            user.setPasswordResetExpiresAt(Instant.now().plus(2, ChronoUnit.HOURS));
            userRepository.save(user);

            String tenantName = user.getTenant() != null ? user.getTenant().getName() : "sua conta";
            emailService.sendPasswordReset(user.getEmail(), user.getUsername(), tenantName, token);
        }

        // Resposta SEMPRE identica, exista ou nao o e-mail no sistema - evita que
        // esse endpoint seja usado para descobrir quais e-mails tem conta cadastrada.
        return new EmailConfirmationResponseDTO(true,
                "Se existir uma conta com esse e-mail, você receberá instruções para redefinir sua senha.");
    }

    @Transactional
    public EmailConfirmationResponseDTO resetPassword(ResetPasswordRequestDTO request) {
        User user = userRepository.findByPasswordResetToken(request.token())
                .orElse(null);

        if (user == null) {
            return new EmailConfirmationResponseDTO(false, "Link de redefinição inválido.");
        }

        if (user.getPasswordResetExpiresAt() != null
                && user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
            return new EmailConfirmationResponseDTO(false, "Link de redefinição expirado. Solicite um novo.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);

        return new EmailConfirmationResponseDTO(true, "Senha redefinida com sucesso.");
    }

    @Transactional(readOnly = true)
    public AuthMeResponseDTO getCurrentUser(UUID userId, UUID tenantId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + userId));
        return new AuthMeResponseDTO(userId, tenantId, role, user.getUsername(), user.getEmail(),
                user.getJobTitle(), user.getCommitteeRole());
    }
}