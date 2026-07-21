package com.projeto.assistant.service;

import com.projeto.assistant.dto.DocumentRequestDTO;
import com.projeto.assistant.dto.DocumentResponseDTO;
import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.DocumentRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import java.util.Map;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public DocumentResponseDTO create(DocumentRequestDTO request) {
        Workspace workspace = workspaceRepository.findById(request.workspaceId())
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + request.workspaceId()));

        User createdBy = userRepository.findById(request.createdByUserId())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + request.createdByUserId()));

        Document document = new Document();
        document.setWorkspace(workspace);
        document.setCreatedBy(createdBy);
        document.setType(request.type());
        document.setTitle(request.title());

        Document saved = documentRepository.save(document);

        auditLogService.record(
                workspace.getTenant().getId(),
                createdBy.getId(),
                AuditAction.CREATE,
                AuditEntityType.DOCUMENT,
                saved.getId(),
                Map.of("title", saved.getTitle(), "type", saved.getType().name())
        );

        return DocumentResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponseDTO> findByWorkspace(UUID workspaceId) {
        return documentRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(DocumentResponseDTO::fromEntity)
                .toList();
    }

}