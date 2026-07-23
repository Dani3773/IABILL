package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.ActionItemStatus;
import com.projeto.assistant.service.ActionItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/action-items")
@RequiredArgsConstructor
public class ActionItemController {

    private final ActionItemService actionItemService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ActionItemResponseDTO create(
            @Valid @RequestBody ActionItemRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return actionItemService.create(request, authTenantId, authUserId);
    }

    @GetMapping
    public List<ActionItemResponseDTO> findByWorkspace(
            @RequestParam UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return actionItemService.findByWorkspace(workspaceId, authTenantId);
    }

    @PutMapping("/{id}/status")
    public ActionItemResponseDTO updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ActionItemStatusUpdateDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return actionItemService.updateStatus(id, request.status(), authTenantId, authUserId);
    }

    @PostMapping("/suggest")
    public List<SuggestedActionItemDTO> suggest(
            @RequestParam UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return actionItemService.generateSuggestions(workspaceId, authTenantId, authUserId);
    }
}