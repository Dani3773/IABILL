package com.projeto.assistant.service;

import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.DocumentStatus;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.DocumentRepository;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import com.projeto.assistant.model.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock private DocumentRepository documentRepository;
    @Mock private WorkspaceRepository workspaceRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditLogService auditLogService;

    @InjectMocks
    private DocumentService documentService;

    private UUID tenantId;
    private UUID otherTenantId;
    private UUID authUserId;
    private Document document;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        otherTenantId = UUID.randomUUID();
        authUserId = UUID.randomUUID();

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);

        Workspace workspace = new Workspace();
        workspace.setTenant(tenant);

        User createdBy = new User();
        createdBy.setId(UUID.randomUUID());

        document = new Document();
        document.setId(UUID.randomUUID());
        document.setWorkspace(workspace);
        document.setCreatedBy(createdBy);
        document.setStatus(DocumentStatus.GENERATED);
    }

    @Test
    void approve_whenStatusIsNotReviewed_shouldThrowIllegalArgumentException() {
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));

        assertThatThrownBy(() -> documentService.approve(document.getId(), tenantId, authUserId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("REVIEWED");
    }

    @Test
    void approve_whenTenantMismatch_shouldThrowAccessDeniedException() {
        document.setStatus(DocumentStatus.REVIEWED);
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));

        assertThatThrownBy(() -> documentService.approve(document.getId(), otherTenantId, authUserId))
                .isInstanceOf(AccessDeniedException.class);
    }

    void reject_whenStatusIsDraft_shouldThrowIllegalArgumentException() {
        document.setStatus(DocumentStatus.DRAFT);
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));

        assertThatThrownBy(() -> documentService.reject(document.getId(), "motivo", tenantId, authUserId))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void approve_whenStatusIsReviewed_shouldSucceedAndFlagRelatedDocuments() {
        document.setStatus(DocumentStatus.REVIEWED);
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(documentRepository.save(document)).thenReturn(document);
        when(documentRepository.findByWorkspaceIdAndStatusIn(any(), any())).thenReturn(List.of());

        var result = documentService.approve(document.getId(), tenantId, authUserId);

        assertThat(result.status()).isEqualTo(DocumentStatus.APPROVED);
    }

    @Test
    void reject_whenStatusIsGenerated_shouldSucceedAndResetToDraft() {
        when(documentRepository.findById(document.getId())).thenReturn(Optional.of(document));
        when(documentRepository.save(document)).thenReturn(document);

        var result = documentService.reject(document.getId(), "motivo do teste", tenantId, authUserId);

        assertThat(result.status()).isEqualTo(DocumentStatus.DRAFT);
    }
}