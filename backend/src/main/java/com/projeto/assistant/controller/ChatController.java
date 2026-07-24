package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.*;
import com.projeto.assistant.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChatConversationResponseDTO createConversation(
            @RequestParam UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return chatService.createConversation(workspaceId, authTenantId, authUserId);
    }

    @GetMapping
    public List<ChatConversationResponseDTO> listConversations(
            @RequestParam UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return chatService.listConversations(workspaceId, authTenantId, authUserId);
    }

    @GetMapping("/{conversationId}/messages")
    public List<ChatMessageResponseDTO> getMessages(
            @PathVariable UUID conversationId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return chatService.getMessages(conversationId, authTenantId, authUserId);
    }

    @PostMapping("/{conversationId}/messages")
    public ChatMessageResponseDTO sendMessage(
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendChatMessageRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return chatService.sendMessage(conversationId, request.message(), authTenantId, authUserId);
    }
}