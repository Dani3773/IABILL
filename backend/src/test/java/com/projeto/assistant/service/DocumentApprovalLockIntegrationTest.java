package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.DocumentStatus;
import com.projeto.assistant.model.DocumentType;
import com.projeto.assistant.model.Tenant;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.UserRole;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.model.WorkspaceType;
import com.projeto.assistant.repository.DocumentRepository;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DocumentApprovalLockIntegrationTest extends IntegrationTestBase {

    private static final String APPROVED_CONTENT = "versao aprovada";

    @Autowired private DocumentService documentService;
    @Autowired private DocumentChunkService documentChunkService;
    @Autowired private ChatService chatService;
    @Autowired private AuditLogService auditLogService;

    @Autowired private TenantRepository tenantRepository;
    @Autowired private WorkspaceRepository workspaceRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DocumentRepository documentRepository;

    @MockitoBean private GeminiGenerationService geminiGenerationService;
    @MockitoBean private GeminiFunctionCallingService geminiFunctionCallingService;

    private UUID tenantId;
    private UUID workspaceId;
    private UUID userId;
    private Workspace workspace;

    @BeforeEach
    void setUp() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Trava");
        tenant = tenantRepository.save(tenant);
        tenantId = tenant.getId();

        Workspace newWorkspace = new Workspace();
        newWorkspace.setTenant(tenant);
        newWorkspace.setName("Workspace Trava");
        newWorkspace.setType(WorkspaceType.MATRIZ);
        newWorkspace.setDocumentId(String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 14));
        workspace = workspaceRepository.save(newWorkspace);
        workspaceId = workspace.getId();

        User user = new User();
        user.setTenant(tenant);
        user.setUsername("teste.trava");
        user.setEmail("teste." + UUID.randomUUID() + "@iabill-test.com");
        user.setPasswordHash("nao-sera-usado-neste-teste");
        user.setRole(UserRole.ADMIN);
        userId = userRepository.save(user).getId();
    }

    private UUID newDocument(DocumentStatus status) {
        Document document = new Document();
        document.setWorkspace(workspace);
        document.setType(DocumentType.POLITICA_PRIVACIDADE);
        document.setTitle("Politica");
        document.setStatus(status);
        document.setGeneratedContent(APPROVED_CONTENT);
        return documentRepository.save(document).getId();
    }

    private void assertUnchangedAndApproved(UUID documentId) {
        Document reloaded = documentRepository.findById(documentId).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(DocumentStatus.APPROVED);
        assertThat(reloaded.getGeneratedContent()).isEqualTo(APPROVED_CONTENT);
    }

    @Test
    void updateContent_whenDocumentIsApproved_shouldThrowAndKeepContent() {
        UUID documentId = newDocument(DocumentStatus.APPROVED);

        assertThatThrownBy(() -> documentService.updateContent(documentId, "alterado", tenantId, userId))
                .isInstanceOf(IllegalArgumentException.class);

        assertUnchangedAndApproved(documentId);
    }

    @Test
    void updateContent_whenDocumentIsNotApproved_shouldPersistNewContent() {
        UUID documentId = newDocument(DocumentStatus.GENERATED);

        var updated = documentService.updateContent(documentId, "alterado", tenantId, userId);

        assertThat(updated.generatedContent()).isEqualTo("alterado");
    }

    @Test
    void updateContent_whenDocumentIsReviewed_shouldReturnToGeneratedAndAuditTransition() {
        UUID documentId = newDocument(DocumentStatus.REVIEWED);

        var updated = documentService.updateContent(documentId, "alterado depois da revisao", tenantId, userId);

        assertThat(updated.status()).isEqualTo(DocumentStatus.GENERATED);
        assertThat(auditLogService.findByTenant(tenantId))
                .anyMatch(log -> log.entityId().equals(documentId)
                        && "REVIEWED -> GENERATED".equals(log.metadata().get("statusChange")));
    }

    @Test
    void generateAssistedContent_whenDocumentIsApproved_shouldThrowWithoutCallingModel() {
        UUID documentId = newDocument(DocumentStatus.APPROVED);

        assertThatThrownBy(() -> documentChunkService.generateAssistedContent(documentId, "reescreva", tenantId, userId))
                .isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(geminiGenerationService);
        assertUnchangedAndApproved(documentId);
    }

    @Test
    void chatGenerationTool_whenDocumentIsApproved_shouldKeepDocumentAndStillReply() {
        UUID documentId = newDocument(DocumentStatus.APPROVED);
        var conversation = chatService.createConversation(workspaceId, tenantId, userId);

        Map<String, Object> toolCall = Map.of("parts", List.of(Map.of("functionCall", Map.of(
                "name", "gerar_conteudo_documento",
                "args", Map.of("documentId", documentId.toString(), "instruction", "reescreva")))));
        Map<String, Object> finalAnswer = Map.of("parts", List.of(Map.of("text", "Esse documento está aprovado.")));
        when(geminiFunctionCallingService.generateWithTools(any(), any())).thenReturn(toolCall, finalAnswer);

        var reply = chatService.sendMessage(conversation.id(), "Reescreva a politica", tenantId, userId);

        assertThat(reply.content()).isEqualTo("Esse documento está aprovado.");
        verifyNoInteractions(geminiGenerationService);
        assertUnchangedAndApproved(documentId);
    }
}
