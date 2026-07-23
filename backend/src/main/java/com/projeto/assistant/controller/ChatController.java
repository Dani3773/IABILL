package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.ChatRequestDTO;
import com.projeto.assistant.dto.ChatResponseDTO;
import com.projeto.assistant.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ChatResponseDTO sendMessage(
            @Valid @RequestBody ChatRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return chatService.sendMessage(request, authTenantId, authUserId);
    }
}