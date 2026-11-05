package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuditLogImmutabilityIntegrationTest extends IntegrationTestBase {

    @Autowired private AuditLogService auditLogService;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TransactionTemplate transactionTemplate;

    private UUID tenantId;
    private UUID userId;
    private UUID entityId;

    @BeforeEach
    void setUp() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Auditoria");
        tenant = tenantRepository.save(tenant);
        tenantId = tenant.getId();

        User user = new User();
        user.setTenant(tenant);
        user.setUsername("teste.auditoria");
        user.setEmail("teste." + UUID.randomUUID() + "@iabill-test.com");
        user.setPasswordHash("nao-sera-usado-neste-teste");
        user.setRole(UserRole.ADMIN);
        user = userRepository.save(user);
        userId = user.getId();

        entityId = UUID.randomUUID();
        auditLogService.record(tenantId, userId, AuditAction.CREATE, AuditEntityType.DOCUMENT, entityId,
                Map.of("title", "original"));
    }

    private int countLogsOfEntity() {
        return jdbcTemplate.queryForObject(
                "SELECT count(*) FROM audit_logs WHERE entity_id = ?", Integer.class, entityId);
    }

    @Test
    void insert_shouldStillBeAllowed() {
        assertThat(countLogsOfEntity()).isEqualTo(1);
    }

    // Mesmo formato de metadados da geracao por IA: valores Long voltam do JSON como
    // Integer, o que faria o Hibernate tentar um UPDATE ao comparar a entidade.
    @Test
    void recordInsideTransaction_withNumericAndListMetadata_shouldNotAttemptUpdate() {
        UUID generatedDocumentId = UUID.randomUUID();

        transactionTemplate.executeWithoutResult(status -> auditLogService.record(
                tenantId, userId, AuditAction.AI_GENERATE, AuditEntityType.DOCUMENT, generatedDocumentId,
                Map.of("chunksUsed", 5, "retrievalLatencyMs", 716L, "sourceDocumentIds", List.of("doc-1"))));

        Integer logs = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM audit_logs WHERE entity_id = ?", Integer.class, generatedDocumentId);
        assertThat(logs).isEqualTo(1);
    }

    @Test
    void update_shouldBeRejectedByDatabaseAndKeepRow() {
        assertThatThrownBy(() -> jdbcTemplate.update(
                "UPDATE audit_logs SET action = 'DELETE' WHERE entity_id = ?", entityId))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("imutavel");

        String action = jdbcTemplate.queryForObject(
                "SELECT action FROM audit_logs WHERE entity_id = ?", String.class, entityId);
        assertThat(action).isEqualTo("CREATE");
    }

    @Test
    void delete_shouldBeRejectedByDatabaseAndKeepRow() {
        assertThatThrownBy(() -> jdbcTemplate.update("DELETE FROM audit_logs WHERE entity_id = ?", entityId))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("imutavel");

        assertThat(countLogsOfEntity()).isEqualTo(1);
    }

    @Test
    void truncate_shouldBeRejectedByDatabaseAndKeepRow() {
        assertThatThrownBy(() -> jdbcTemplate.execute("TRUNCATE audit_logs"))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("imutavel");

        assertThat(countLogsOfEntity()).isEqualTo(1);
    }

    @Test
    void deletingUserWithAuditHistory_shouldBeRejected() {
        assertThatThrownBy(() -> jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId))
                .isInstanceOf(DataAccessException.class)
                .hasMessageContaining("imutavel");
    }
}
