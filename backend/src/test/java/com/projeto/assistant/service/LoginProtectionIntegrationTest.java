package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.controller.TenantController;
import com.projeto.assistant.dto.LoginRequestDTO;
import com.projeto.assistant.dto.TenantRequestDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginProtectionIntegrationTest extends IntegrationTestBase {

    private static final String CORRECT_PASSWORD = "senha-correta-do-teste";
    private static final int MAX_FAILED_LOGINS = 10;

    @Autowired private AuthService authService;
    @Autowired private TenantController tenantController;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String email;

    @BeforeEach
    void setUp() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Login");
        tenant = tenantRepository.save(tenant);

        email = "teste." + UUID.randomUUID() + "@iabill-test.com";

        User user = new User();
        user.setTenant(tenant);
        user.setUsername("teste.login");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(CORRECT_PASSWORD));
        user.setRole(UserRole.ADMIN);
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    private void failLogin(int attempts) {
        for (int i = 0; i < attempts; i++) {
            assertThatThrownBy(() -> authService.login(new LoginRequestDTO(email, "senha-errada")))
                    .isInstanceOf(ResponseStatusException.class);
        }
    }

    @Test
    void login_afterTooManyFailures_shouldBlockEvenWithCorrectPassword() {
        failLogin(MAX_FAILED_LOGINS);

        assertThatThrownBy(() -> authService.login(new LoginRequestDTO(email, CORRECT_PASSWORD)))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void login_shouldIgnoreEmailCaseWhenCountingFailures() {
        failLogin(MAX_FAILED_LOGINS);

        assertThatThrownBy(() -> authService.login(new LoginRequestDTO(email.toUpperCase(), "senha-errada")))
                .isInstanceOf(RateLimitExceededException.class);
    }

    @Test
    void login_whenSuccessful_shouldClearPreviousFailures() {
        failLogin(MAX_FAILED_LOGINS - 1);

        assertThat(authService.login(new LoginRequestDTO(email, CORRECT_PASSWORD)).mfaRequired()).isFalse();

        failLogin(MAX_FAILED_LOGINS - 1);
        assertThat(authService.login(new LoginRequestDTO(email, CORRECT_PASSWORD)).mfaRequired()).isFalse();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createTenant_whenRequesterIsAdmin_shouldThrowAccessDeniedException() {
        assertThatThrownBy(() -> tenantController.create(new TenantRequestDTO("Tenant indevido", null, null)))
                .isInstanceOf(AccessDeniedException.class);
    }
}
