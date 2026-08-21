package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
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

class ChatServiceIntegrationTest extends IntegrationTestBase {

    @Autowired private ChatService chatService;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private WorkspaceRepository workspaceRepository;
    @Autowired private UserRepository userRepository;

    private UUID workspaceId;
    private UUID tenantId;
    private UUID otherTenantId;
    private UUID authUserId;
    private UUID otherUserId;

    @BeforeEach
    void setUp() {
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Teste Chat");
        tenant.setDocumentId(randomDocumentId());
        tenant.setCountry("BR");
        tenant = tenantRepository.save(tenant);
        tenantId = tenant.getId();

        Tenant otherTenant = new Tenant();
        otherTenant.setName("Outra Empresa Chat");
        otherTenant.setDocumentId(randomDocumentId());
        otherTenant.setCountry("BR");
        otherTenant = tenantRepository.save(otherTenant);
        otherTenantId = otherTenant.getId();

        Workspace workspace = new Workspace();
        workspace.setTenant(tenant);
        workspace.setName("Matriz Teste Chat");
        workspace.setType(WorkspaceType.MATRIZ);
        workspace.setDocumentId(randomDocumentId());
        workspace = workspaceRepository.save(workspace);
        workspaceId = workspace.getId();

        User user = new User();
        user.setTenant(tenant);
        user.setUsername("teste.chat.dono");
        user.setEmail("teste.chat.dono." + UUID.randomUUID() + "@iabill-test.com");
        user.setPasswordHash("nao-sera-usado-neste-teste");
        user.setRole(UserRole.ADMIN);
        user = userRepository.save(user);
        authUserId = user.getId();

        // Segundo usuario do MESMO tenant, para validar o segundo nivel de isolamento -
        // uma conversa nao e so escopada por tenant, e tambem privada por usuario.
        User otherUser = new User();
        otherUser.setTenant(tenant);
        otherUser.setUsername("teste.chat.outro");
        otherUser.setEmail("teste.chat.outro." + UUID.randomUUID() + "@iabill-test.com");
        otherUser.setPasswordHash("nao-sera-usado-neste-teste");
        otherUser.setRole(UserRole.USER);
        otherUser = userRepository.save(otherUser);
        otherUserId = otherUser.getId();
    }

    private String randomDocumentId() {
        return String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 14);
    }

    @Test
    void createConversation_thenListConversations_shouldReturnPersistedConversation() {
        var created = chatService.createConversation(workspaceId, tenantId, authUserId);

        var found = chatService.listConversations(workspaceId, tenantId, authUserId);

        assertThat(found).hasSize(1);
        assertThat(found.get(0).id()).isEqualTo(created.id());
    }

    @Test
    void createConversation_withMismatchedTenant_shouldThrowAccessDeniedException() {
        assertThatThrownBy(() -> chatService.createConversation(workspaceId, otherTenantId, authUserId))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void listConversations_shouldOnlyReturnConversationsOfRequestingUser() {
        chatService.createConversation(workspaceId, tenantId, authUserId);
        chatService.createConversation(workspaceId, tenantId, otherUserId);

        var foundForAuthUser = chatService.listConversations(workspaceId, tenantId, authUserId);
        var foundForOtherUser = chatService.listConversations(workspaceId, tenantId, otherUserId);

        assertThat(foundForAuthUser).hasSize(1);
        assertThat(foundForOtherUser).hasSize(1);
    }

    @Test
    void getMessages_withEmptyConversation_shouldReturnEmptyList() {
        var conversation = chatService.createConversation(workspaceId, tenantId, authUserId);

        var messages = chatService.getMessages(conversation.id(), tenantId, authUserId);

        assertThat(messages).isEmpty();
    }

    @Test
    void getMessages_whenConversationBelongsToAnotherUser_shouldThrowAccessDeniedException() {
        var conversation = chatService.createConversation(workspaceId, tenantId, authUserId);

        assertThatThrownBy(() -> chatService.getMessages(conversation.id(), tenantId, otherUserId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("outro usuário");
    }

    @Test
    void getMessages_withMismatchedTenant_shouldThrowAccessDeniedException() {
        var conversation = chatService.createConversation(workspaceId, tenantId, authUserId);

        assertThatThrownBy(() -> chatService.getMessages(conversation.id(), otherTenantId, authUserId))
                .isInstanceOf(AccessDeniedException.class);
    }
}