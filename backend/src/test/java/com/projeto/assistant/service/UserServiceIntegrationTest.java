package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.dto.UserRequestDTO;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserServiceIntegrationTest extends IntegrationTestBase {

    @Autowired private UserService userService;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;

    // Evita envio real pelo SES caso a maquina tenha credenciais AWS configuradas.
    @MockitoBean private EmailService emailService;

    private UUID ownTenantId;
    private UUID otherTenantId;
    private UUID adminId;
    private UUID superAdminId;

    @BeforeEach
    void setUp() {
        ownTenantId = createTenant("Empresa Propria");
        otherTenantId = createTenant("Outra Empresa");

        User admin = newUser(UserRole.ADMIN);
        admin.setTenant(tenantRepository.findById(ownTenantId).orElseThrow());
        adminId = userRepository.save(admin).getId();

        // Conta de plataforma pura: Super-Admin nao tem tenant proprio.
        superAdminId = userRepository.save(newUser(UserRole.SUPER_ADMIN)).getId();
    }

    private UUID createTenant(String name) {
        Tenant tenant = new Tenant();
        tenant.setName(name);
        return tenantRepository.save(tenant).getId();
    }

    private User newUser(UserRole role) {
        User user = new User();
        user.setUsername("teste." + role.name().toLowerCase());
        user.setEmail(randomEmail());
        user.setPasswordHash("nao-sera-usado-neste-teste");
        user.setRole(role);
        return user;
    }

    private String randomEmail() {
        return "teste." + UUID.randomUUID() + "@iabill-test.com";
    }

    private UserRequestDTO request(UUID tenantId, String email, UserRole role) {
        return new UserRequestDTO(tenantId, "convidado", email, role, null, null, null);
    }

    @Test
    void create_whenAdminRequestsSuperAdminRole_shouldThrowAndPersistNothing() {
        String email = randomEmail();

        assertThatThrownBy(() -> userService.create(request(ownTenantId, email, UserRole.SUPER_ADMIN), adminId))
                .isInstanceOf(AccessDeniedException.class);

        assertThat(userRepository.findByEmail(email)).isEmpty();
    }

    @Test
    void create_whenAdminSendsOtherTenantId_shouldCreateInOwnTenant() {
        var created = userService.create(request(otherTenantId, randomEmail(), UserRole.ADMIN), adminId);

        assertThat(created.tenantId()).isEqualTo(ownTenantId);
    }

    @Test
    void create_whenCreatorIsSuperAdmin_shouldUseTenantFromRequest() {
        var created = userService.create(request(otherTenantId, randomEmail(), UserRole.ADMIN), superAdminId);

        assertThat(created.tenantId()).isEqualTo(otherTenantId);
    }
}
