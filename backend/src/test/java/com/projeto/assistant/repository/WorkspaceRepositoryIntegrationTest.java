package com.projeto.assistant.repository;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WorkspaceRepositoryIntegrationTest extends IntegrationTestBase {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Test
    void save_thenFindByTenantId_shouldReturnPersistedWorkspace() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Integracao Teste");
        tenant.setDocumentId("11122233000144");
        tenant.setCountry("BR");
        Tenant savedTenant = tenantRepository.save(tenant);

        Workspace workspace = new Workspace();
        workspace.setTenant(savedTenant);
        workspace.setName("Matriz Teste Integracao");
        workspace.setType(WorkspaceType.MATRIZ);
        workspace.setDocumentId("55566677000188");
        workspaceRepository.save(workspace);

        var found = workspaceRepository.findByTenantId(savedTenant.getId());

        assertThat(found).hasSize(1);
        assertThat(found.get(0).getName()).isEqualTo("Matriz Teste Integracao");
    }

    @Test
    void save_withDuplicateDocumentIdInSameTenant_shouldViolateUniqueConstraint() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Constraint Teste");
        tenant.setDocumentId("99988877000111");
        tenant.setCountry("BR");
        Tenant savedTenant = tenantRepository.save(tenant);

        Workspace first = new Workspace();
        first.setTenant(savedTenant);
        first.setName("Primeira Filial");
        first.setType(WorkspaceType.FILIAL);
        first.setDocumentId("11111111000111");
        workspaceRepository.saveAndFlush(first);

        Workspace duplicate = new Workspace();
        duplicate.setTenant(savedTenant);
        duplicate.setName("Segunda Filial - mesmo CNPJ");
        duplicate.setType(WorkspaceType.FILIAL);
        duplicate.setDocumentId("11111111000111"); // mesmo documentId do "first", mesmo tenant

        assertThatThrownBy(() -> workspaceRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}