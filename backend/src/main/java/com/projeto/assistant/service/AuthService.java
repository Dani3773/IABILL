package com.projeto.assistant.service;

import com.projeto.assistant.dto.LoginRequestDTO;
import com.projeto.assistant.dto.LoginResponseDTO;
import com.projeto.assistant.dto.SignupRequestDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;
import com.projeto.assistant.dto.SignupResponseDTO;
import com.projeto.assistant.dto.EmailConfirmationResponseDTO;

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
    public LoginResponseDTO login(LoginRequestDTO request) {
        // Busca TODOS os usuarios com esse e-mail, em qualquer tenant (email e unico
        // POR tenant, nao globalmente - ver decisao de design da modelagem de User).
        List<User> candidates = userRepository.findByEmail(request.email());

        // Filtra pelo primeiro cujo hash de senha bate. Na pratica, e-mails corporativos
        // sao globalmente unicos (dominio da empresa garante isso), entao colisao real
        // entre tenants e praticamente impossivel - mas o codigo trata o caso mesmo assim.
        // LIMITACAO CONHECIDA E DOCUMENTADA: se por algum motivo o mesmo par e-mail+senha
        // existir em mais de um tenant, o primeiro encontrado "ganha" - aceitavel para o
        // escopo atual do projeto, mas anotado na tasklist para revisitar se necessario.
        User matchedUser = candidates.stream()
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));

        if (!matchedUser.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
        }

        UUID tenantId = matchedUser.getTenant() != null ? matchedUser.getTenant().getId() : null;
        String token = jwtService.generateToken(matchedUser.getId(), tenantId, matchedUser.getRole().name());
        return new LoginResponseDTO(token, matchedUser.getId(), tenantId, matchedUser.getRole().name());
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
}