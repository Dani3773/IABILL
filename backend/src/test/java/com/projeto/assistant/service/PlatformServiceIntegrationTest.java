package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.dto.PlatformTenantUpdateRequestDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PlatformServiceIntegrationTest extends IntegrationTestBase {

    @Autowired private PlatformService platformService;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;

    private UUID tenantId;
    private UUID superAdminUserId;

    @BeforeEach
    void setUp() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Teste Platform");
        tenant.setDocumentId(randomDocumentId());
        tenant.setCountry("BR");
        tenant = tenantRepository.save(tenant);
        tenantId = tenant.getId();

        // Super-Admin real, sem tenant proprio - mesmo padrao ja documentado no projeto
        // (conta de plataforma pura, tenant_id nulo).
        User superAdmin = new User();
        superAdmin.setUsername("teste.superadmin");
        superAdmin.setEmail("teste.superadmin." + UUID.randomUUID() + "@iabill-test.com");
        superAdmin.setPasswordHash("nao-sera-usado-neste-teste");
        superAdmin.setRole(UserRole.SUPER_ADMIN);
        superAdmin = userRepository.save(superAdmin);
        superAdminUserId = superAdmin.getId();
    }

    private String randomDocumentId() {
        return String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 14);
    }

    @Test
    void listAllTenants_shouldIncludeTenantCreatedInSetUp() {
        var all = platformService.listAllTenants();

        assertThat(all).anyMatch(t -> t.id().equals(tenantId));
    }

    @Test
    void getTenantDetail_shouldReturnTenantEvenWithoutSuperAdminOwningIt() {
        // Confirma o comportamento intencional deste Service: Super-Admin acessa
        // QUALQUER tenant, diferente de todo o resto do sistema, onde acesso cross
        // tenant e sempre bloqueado.
        var detail = platformService.getTenantDetail(tenantId);

        assertThat(detail.name()).isEqualTo("Empresa Teste Platform");
        assertThat(detail.active()).isTrue();
    }

    @Test
    void updateTenant_shouldPersistNewName() {
        var updated = platformService.updateTenant(tenantId, new PlatformTenantUpdateRequestDTO("Nome Atualizado"), superAdminUserId);

        assertThat(updated.name()).isEqualTo("Nome Atualizado");
    }

    @Test
    void setTenantActive_toFalse_thenToTrue_shouldToggleCorrectly() {
        var deactivated = platformService.setTenantActive(tenantId, false, superAdminUserId);
        assertThat(deactivated.active()).isFalse();

        var reactivated = platformService.setTenantActive(tenantId, true, superAdminUserId);
        assertThat(reactivated.active()).isTrue();
    }

    @Test
    void resetUserPassword_shouldGenerateTwelveCharacterPassword() {
        User user = new User();
        user.setTenant(tenantRepository.findById(tenantId).orElseThrow());
        user.setUsername("teste.reset");
        user.setEmail("teste.reset." + UUID.randomUUID() + "@iabill-test.com");
        user.setPasswordHash("hash-antigo-qualquer");
        user.setRole(UserRole.USER);
        user = userRepository.save(user);

        var result = platformService.resetUserPassword(user.getId(), superAdminUserId);

        assertThat(result.temporaryPassword()).hasSize(12);
    }
}