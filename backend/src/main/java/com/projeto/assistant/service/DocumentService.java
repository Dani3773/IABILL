package com.projeto.assistant.service;

import com.projeto.assistant.dto.DocumentRequestDTO;
import com.projeto.assistant.dto.DocumentResponseDTO;
import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.User;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.DocumentRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;
import com.projeto.assistant.model.DocumentStatus;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

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
    public List<DocumentResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        return documentRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(DocumentResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponseDTO findById(UUID documentId, UUID authTenantId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + documentId));

        if (!document.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este documento");
        }

        return DocumentResponseDTO.fromEntity(document);
    }

    @Transactional
    public DocumentResponseDTO updateContent(UUID documentId, String content, UUID authTenantId, UUID authUserId) {
        Document document = getValidatedDocument(documentId, authTenantId);

        document.setGeneratedContent(content);
        Document saved = documentRepository.save(document);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.DOCUMENT, documentId,
                Map.of("field", "generatedContent"));

        return DocumentResponseDTO.fromEntity(saved);
    }

    @Transactional
    public DocumentResponseDTO markReviewed(UUID documentId, UUID authTenantId, UUID authUserId) {
        Document document = getValidatedDocument(documentId, authTenantId);

        if (document.getStatus() != DocumentStatus.GENERATED) {
            throw new IllegalArgumentException("Só é possível revisar documentos com status GENERATED (atual: " + document.getStatus() + ")");
        }

        document.setStatus(DocumentStatus.REVIEWED);
        Document saved = documentRepository.save(document);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.DOCUMENT, documentId,
                Map.of("statusChange", "GENERATED -> REVIEWED"));

        return DocumentResponseDTO.fromEntity(saved);
    }

    @Transactional
    public DocumentResponseDTO approve(UUID documentId, UUID authTenantId, UUID authUserId) {
        Document document = getValidatedDocument(documentId, authTenantId);

        if (document.getStatus() != DocumentStatus.REVIEWED) {
            throw new IllegalArgumentException("Só é possível aprovar documentos com status REVIEWED (atual: " + document.getStatus() + ")");
        }

        document.setStatus(DocumentStatus.APPROVED);
        Document saved = documentRepository.save(document);

        auditLogService.record(authTenantId, authUserId, AuditAction.APPROVE, AuditEntityType.DOCUMENT, documentId,
                Map.of("statusChange", "REVIEWED -> APPROVED"));

        // Um documento recem-aprovado pode conter informacao que torna outros
        // documentos ja fechados desatualizados - sinaliza os demais para revisao.
        flagRelatedDocumentsForReview(document.getWorkspace().getId(), documentId, document.getTitle());

        return DocumentResponseDTO.fromEntity(saved);
    }

    private Document getValidatedDocument(UUID documentId, UUID authTenantId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + documentId));

        if (!document.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este documento");
        }

        return document;
    }

    @Transactional
    public DocumentResponseDTO reject(UUID documentId, String reason, UUID authTenantId, UUID authUserId) {
        Document document = getValidatedDocument(documentId, authTenantId);

        if (document.getStatus() != DocumentStatus.GENERATED && document.getStatus() != DocumentStatus.REVIEWED) {
            throw new IllegalArgumentException(
                    "Só é possível rejeitar documentos com status GENERATED ou REVIEWED (atual: " + document.getStatus() + ")");
        }

        DocumentStatus previousStatus = document.getStatus();
        document.setStatus(DocumentStatus.DRAFT);
        Document saved = documentRepository.save(document);

        auditLogService.record(authTenantId, authUserId, AuditAction.REJECT, AuditEntityType.DOCUMENT, documentId,
                Map.of("reason", reason, "statusChange", previousStatus + " -> DRAFT"));

        return DocumentResponseDTO.fromEntity(saved);
    }

    // Sinaliza documentos "fechados" (GENERATED/REVIEWED/APPROVED) do mesmo workspace
    // quando um documento novo e processado - chamado pelo DocumentChunkService logo
    // apos a ingestao. Nunca sinaliza o proprio documento que disparou a ingestao.
    @Transactional
    public void flagRelatedDocumentsForReview(UUID workspaceId, UUID triggeringDocumentId, String triggeringDocumentTitle) {
        List<Document> closedDocuments = documentRepository.findByWorkspaceIdAndStatusIn(
                workspaceId,
                List.of(DocumentStatus.GENERATED, DocumentStatus.REVIEWED, DocumentStatus.APPROVED)
        );

        String reason = "Conteúdo relacionado atualizado em \"" + triggeringDocumentTitle + "\"";

        for (Document doc : closedDocuments) {
            if (doc.getId().equals(triggeringDocumentId)) continue;

            doc.setReviewRecommended(true);
            doc.setReviewRecommendedReason(reason);
            documentRepository.save(doc);
        }
    }

    @Transactional
    public DocumentResponseDTO dismissReviewFlag(UUID documentId, UUID authTenantId, UUID authUserId) {
        Document document = getValidatedDocument(documentId, authTenantId);

        document.setReviewRecommended(false);
        document.setReviewRecommendedReason(null);
        Document saved = documentRepository.save(document);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.DOCUMENT, documentId,
                Map.of("field", "reviewRecommended", "value", "dismissed"));

        return DocumentResponseDTO.fromEntity(saved);
    }

}