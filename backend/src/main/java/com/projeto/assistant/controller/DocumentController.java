package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import org.springframework.web.bind.annotation.RequestAttribute;
import com.projeto.assistant.dto.DocumentRequestDTO;
import com.projeto.assistant.dto.DocumentResponseDTO;
import com.projeto.assistant.service.DocumentService;
import com.projeto.assistant.service.DocumentChunkService;
import com.projeto.assistant.dto.SemanticSearchRequestDTO;
import com.projeto.assistant.dto.SemanticSearchResultDTO;
import com.projeto.assistant.dto.DocumentGenerationRequestDTO;
import com.projeto.assistant.dto.DocumentGenerationResponseDTO;
import com.projeto.assistant.dto.DocumentContentUpdateRequestDTO;
import com.projeto.assistant.dto.DocumentRejectionRequestDTO;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;


import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentChunkService documentChunkService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponseDTO create(@Valid @RequestBody DocumentRequestDTO request) {
        return documentService.create(request);
    }

    @GetMapping
    public List<DocumentResponseDTO> findByWorkspace(
            @RequestParam UUID workspaceId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return documentService.findByWorkspace(workspaceId, authTenantId);
    }

    @PostMapping("/{documentId}/content")
    public Map<String, Object> processContent(@PathVariable UUID documentId, @RequestBody String rawContent) {
        int chunksCreated = documentChunkService.processContent(documentId, rawContent);
        return Map.of("chunksCreated", chunksCreated);
    }

    @PostMapping("/search")
    public List<SemanticSearchResultDTO> search(
            @Valid @RequestBody SemanticSearchRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return documentChunkService.semanticSearch(
                request.workspaceId(),
                request.query(),
                request.limitOrDefault(),
                authTenantId
        );
    }

    @PostMapping("/{documentId}/generate")
    public DocumentGenerationResponseDTO generate(
            @PathVariable UUID documentId,
            @Valid @RequestBody DocumentGenerationRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return documentChunkService.generateAssistedContent(documentId, request.instruction(), authTenantId, authUserId);
    }

    @GetMapping("/{documentId}")
    public DocumentResponseDTO findById(
            @PathVariable UUID documentId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId) {
        return documentService.findById(documentId, authTenantId);
    }

    @PutMapping("/{documentId}/content")
    public DocumentResponseDTO updateContent(
            @PathVariable UUID documentId,
            @Valid @RequestBody DocumentContentUpdateRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return documentService.updateContent(documentId, request.content(), authTenantId, authUserId);
    }

    @PutMapping("/{documentId}/review")
    public DocumentResponseDTO markReviewed(
            @PathVariable UUID documentId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return documentService.markReviewed(documentId, authTenantId, authUserId);
    }

    @PutMapping("/{documentId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public DocumentResponseDTO approve(
            @PathVariable UUID documentId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return documentService.approve(documentId, authTenantId, authUserId);
    }

    @PutMapping("/{documentId}/reject")
    public DocumentResponseDTO reject(
            @PathVariable UUID documentId,
            @Valid @RequestBody DocumentRejectionRequestDTO request,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_TENANT_ID) UUID authTenantId,
            @RequestAttribute(JwtAuthenticationFilter.ATTR_USER_ID) UUID authUserId) {
        return documentService.reject(documentId, request.reason(), authTenantId, authUserId);
    }

}