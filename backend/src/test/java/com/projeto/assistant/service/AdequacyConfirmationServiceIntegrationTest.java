package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.dto.AdequacyConfirmationResponseDTO;
import com.projeto.assistant.model.AdequacyItem;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdequacyConfirmationServiceIntegrationTest extends IntegrationTestBase {

    @Autowired private AdequacyConfirmationService confirmationService;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private WorkspaceRepository workspaceRepository;

    private Tenant tenantA;
    private Tenant tenantB;
    private Workspace workspaceA;
    private User adminA;
    private User otherAdminA;

    @BeforeEach
    void setUp() {
        tenantA = newTenant("Empresa A");
        tenantB = newTenant("Empresa B");
        workspaceA = newWorkspace(tenantA);
        adminA = newUser(tenantA);
        otherAdminA = newUser(tenantA);
    }

    private Tenant newTenant(String name) {
        Tenant tenant = new Tenant();
        tenant.setName(name);
        return tenantRepository.save(tenant);
    }

    private Workspace newWorkspace(Tenant tenant) {
        Workspace workspace = new Workspace();
        workspace.setTenant(tenant);
        workspace.setName("Workspace " + tenant.getName());
        workspace.setType(WorkspaceType.MATRIZ);
        workspace.setDocumentId(String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 14));
        return workspaceRepository.save(workspace);
    }

    private User newUser(Tenant tenant) {
        User user = new User();
        user.setTenant(tenant);
        user.setUsername("teste." + UUID.randomUUID());
        user.setEmail("teste." + UUID.randomUUID() + "@iabill-test.com");
        user.setPasswordHash("nao-sera-usado-neste-teste");
        user.setRole(UserRole.ADMIN);
        return userRepository.save(user);
    }

    @Test
    void confirm_shouldRecordWhoConfirmedAndWhen() {
        AdequacyConfirmationResponseDTO result = confirmationService.confirm(
                workspaceA.getId(), AdequacyItem.COMITE, tenantA.getId(), adminA.getId());

        assertThat(result.item()).isEqualTo(AdequacyItem.COMITE);
        assertThat(result.confirmedByName()).isEqualTo(adminA.getUsername());
        assertThat(result.confirmedAt()).isNotNull();
    }

    @Test
    void confirm_twice_shouldKeepTheOriginalConfirmation() {
        confirmationService.confirm(workspaceA.getId(), AdequacyItem.COMITE, tenantA.getId(), adminA.getId());

        AdequacyConfirmationResponseDTO second = confirmationService.confirm(
                workspaceA.getId(), AdequacyItem.COMITE, tenantA.getId(), otherAdminA.getId());

        assertThat(second.confirmedByName()).isEqualTo(adminA.getUsername());
        assertThat(confirmationService.findByWorkspace(workspaceA.getId(), tenantA.getId())).hasSize(1);
    }

    @Test
    void revoke_shouldRemoveTheConfirmation() {
        confirmationService.confirm(workspaceA.getId(), AdequacyItem.CANAL_TITULAR, tenantA.getId(), adminA.getId());

        confirmationService.revoke(workspaceA.getId(), AdequacyItem.CANAL_TITULAR, tenantA.getId(), adminA.getId());

        List<AdequacyConfirmationResponseDTO> remaining =
                confirmationService.findByWorkspace(workspaceA.getId(), tenantA.getId());
        assertThat(remaining).isEmpty();
    }

    @Test
    void anyOperation_withUserOfOtherTenant_shouldThrowAccessDeniedException() {
        UUID workspaceId = workspaceA.getId();
        UUID otherTenantId = tenantB.getId();

        assertThatThrownBy(() -> confirmationService.findByWorkspace(workspaceId, otherTenantId))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> confirmationService.confirm(workspaceId, AdequacyItem.COMITE, otherTenantId, adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> confirmationService.revoke(workspaceId, AdequacyItem.COMITE, otherTenantId, adminA.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }
}
