package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.dto.ActionItemRequestDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ActionItemServiceIntegrationTest extends IntegrationTestBase {

    @Autowired private ActionItemService actionItemService;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private WorkspaceRepository workspaceRepository;
    @Autowired private UserRepository userRepository;

    private UUID workspaceId;
    private UUID tenantId;
    private UUID otherTenantId;
    private UUID authUserId;

    @BeforeEach
    void setUp() {
        // CNPJ derivado de um UUID aleatorio a cada execucao de teste - a constraint
        // de unicidade real (uq_tenants_document_id) rejeitaria um valor fixo repetido
        // entre os multiplos metodos @Test desta classe, ja que o Singleton Container
        // mantem o mesmo banco de pe durante toda a suite.
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Teste ActionItem");
        tenant.setDocumentId(randomDocumentId());
        tenant.setCountry("BR");
        tenant = tenantRepository.save(tenant);
        tenantId = tenant.getId();

        Tenant otherTenant = new Tenant();
        otherTenant.setName("Outra Empresa ActionItem");
        otherTenant.setDocumentId(randomDocumentId());
        otherTenant.setCountry("BR");
        otherTenant = tenantRepository.save(otherTenant);
        otherTenantId = otherTenant.getId();

        Workspace workspace = new Workspace();
        workspace.setTenant(tenant);
        workspace.setName("Matriz Teste ActionItem");
        workspace.setType(WorkspaceType.MATRIZ);
        workspace.setDocumentId(randomDocumentId());
        workspace = workspaceRepository.save(workspace);
        workspaceId = workspace.getId();

        // AuditLogService exige um usuario real persistido, nao apenas um UUID solto -
        // sem isso, qualquer chamada que registre auditoria falha com "Usuario nao encontrado".
        User user = new User();
        user.setTenant(tenant);
        user.setUsername("teste.actionitem");
        user.setEmail("teste.actionitem." + UUID.randomUUID() + "@iabill-test.com");
        user.setPasswordHash("nao-sera-usado-neste-teste");
        user.setRole(UserRole.ADMIN);
        user = userRepository.save(user);
        authUserId = user.getId();
    }

    private String randomDocumentId() {
        return String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 14);
    }

    @Test
    void create_thenFindByWorkspace_shouldReturnPersistedItem() {
        var request = new ActionItemRequestDTO(workspaceId, "Nomear DPO", "Designar encarregado sem conflito", null);

        var created = actionItemService.create(request, tenantId, authUserId);

        assertThat(created.status()).isEqualTo(ActionItemStatus.PENDING);
        assertThat(created.source()).isEqualTo(ActionItemSource.MANUAL);

        var found = actionItemService.findByWorkspace(workspaceId, tenantId);
        assertThat(found).hasSize(1);
        assertThat(found.get(0).title()).isEqualTo("Nomear DPO");
    }

    @Test
    void create_withMismatchedTenant_shouldThrowAccessDeniedException() {
        var request = new ActionItemRequestDTO(workspaceId, "Tarefa qualquer", "Descrição", null);

        assertThatThrownBy(() -> actionItemService.create(request, otherTenantId, authUserId))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateStatus_withValidTenant_shouldPersistNewStatus() {
        var request = new ActionItemRequestDTO(workspaceId, "Revisar contratos", "Descrição", null);
        var created = actionItemService.create(request, tenantId, authUserId);

        var updated = actionItemService.updateStatus(created.id(), ActionItemStatus.DONE, tenantId, authUserId);

        assertThat(updated.status()).isEqualTo(ActionItemStatus.DONE);
    }

    @Test
    void updateStatus_withMismatchedTenant_shouldThrowAccessDeniedException() {
        var request = new ActionItemRequestDTO(workspaceId, "Tarefa isolada", "Descrição", null);
        var created = actionItemService.create(request, tenantId, authUserId);

        assertThatThrownBy(() -> actionItemService.updateStatus(created.id(), ActionItemStatus.DONE, otherTenantId, authUserId))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void findByWorkspace_withMismatchedTenant_shouldThrowAccessDeniedException() {
        assertThatThrownBy(() -> actionItemService.findByWorkspace(workspaceId, otherTenantId))
                .isInstanceOf(AccessDeniedException.class);
    }
}