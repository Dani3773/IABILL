package com.projeto.assistant.controller;

import com.projeto.assistant.config.JwtAuthenticationFilter;
import org.springframework.web.bind.annotation.RequestAttribute;
import com.projeto.assistant.dto.DocumentRequestDTO;
import com.projeto.assistant.dto.DocumentResponseDTO;
import com.projeto.assistant.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

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
}