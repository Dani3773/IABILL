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
import com.projeto.assistant.dto.PublicPrivacyPolicyResponseDTO;
import com.projeto.assistant.model.DocumentType;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final DocumentChunkService documentChunkService;

    @Transactional
    public DocumentResponseDTO create(DocumentRequestDTO request, UUID authTenantId, UUID authUserId) {
        Workspace workspace = workspaceRepository.findById(request.workspaceId())
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + request.workspaceId()));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        User createdBy = userRepository.findById(authUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + authUserId));

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
        if (document.getStatus() == DocumentStatus.APPROVED) {
            throw new IllegalArgumentException("Documento aprovado não pode ser alterado");
        }
        document.setGeneratedContent(content);
        // Documento so com conteudo manual (sem nunca passar pela IA) tambem precisa
        // avancar de DRAFT para GENERATED, senao fica preso sem caminho de aprovacao -
        // "Marcar como Revisado" exige status GENERATED independente da origem do conteudo.
        if (document.getStatus() == DocumentStatus.DRAFT) {
            document.setStatus(DocumentStatus.GENERATED);
        }
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
        document.setReviewDueAt(Instant.now().plus(365, ChronoUnit.DAYS));
        Document saved = documentRepository.save(document);
        auditLogService.record(authTenantId, authUserId, AuditAction.APPROVE, AuditEntityType.DOCUMENT, documentId,
                Map.of("statusChange", "REVIEWED -> APPROVED"));
        // Um documento recem-aprovado pode conter informacao que torna outros
        // documentos ja fechados desatualizados - sinaliza os demais para revisao.
        flagRelatedDocumentsForReview(document.getWorkspace().getId(), documentId, document.getTitle());
        // So a partir da aprovacao o conteudo e considerado "oficial" o suficiente
        // para servir de contexto RAG para outros documentos do workspace - ingere
        // (ou reingere, se ja existia uma versao anterior) o conteudo em chunks agora.
        // Sem isso, documentos aprovados pelo fluxo real da UI nunca ficavam
        // pesquisaveis pelo RAG, mesmo depois de aprovados.
        if (saved.getGeneratedContent() != null && !saved.getGeneratedContent().isBlank()) {
            documentChunkService.processContent(documentId, saved.getGeneratedContent(), authTenantId, authUserId);
        }
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

    @Transactional
    public DocumentResponseDTO publish(UUID documentId, UUID authTenantId, UUID authUserId) {
        Document document = getValidatedDocument(documentId, authTenantId);

        if (document.getType() != DocumentType.POLITICA_PRIVACIDADE) {
            throw new IllegalArgumentException("Só é possível publicar documentos do tipo Política de Privacidade");
        }
        if (document.getStatus() != DocumentStatus.APPROVED) {
            throw new IllegalArgumentException("Só é possível publicar documentos aprovados (atual: " + document.getStatus() + ")");
        }

        // Despublica qualquer outra Politica de Privacidade ja publicada no mesmo
        // workspace - garante no maximo uma versao "oficial" publicada por vez,
        // mesmo que a confirmacao do frontend falhe por qualquer motivo.
        documentRepository.findFirstByWorkspaceIdAndTypeAndIsPublishedTrue(
                document.getWorkspace().getId(), DocumentType.POLITICA_PRIVACIDADE
        ).ifPresent(previous -> {
            if (!previous.getId().equals(document.getId())) {
                previous.setPublished(false);
                previous.setPublishedAt(null);
                documentRepository.save(previous);
            }
        });

        document.setPublished(true);
        document.setPublishedAt(Instant.now());
        Document saved = documentRepository.save(document);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.DOCUMENT, documentId,
                Map.of("event", "published"));

        return DocumentResponseDTO.fromEntity(saved);
    }

    @Transactional
    public DocumentResponseDTO unpublish(UUID documentId, UUID authTenantId, UUID authUserId) {
        Document document = getValidatedDocument(documentId, authTenantId);
        document.setPublished(false);
        document.setPublishedAt(null);
        Document saved = documentRepository.save(document);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.DOCUMENT, documentId,
                Map.of("event", "unpublished"));

        return DocumentResponseDTO.fromEntity(saved);
    }

    // Endpoint publico - sem authTenantId, ja que o titular nunca tem conta.
    @Transactional(readOnly = true)
    public PublicPrivacyPolicyResponseDTO getPublishedPrivacyPolicy(String workspaceDocumentId) {
        // Aceita tanto digitos puros (formato correto para URL publica) quanto o CNPJ
        // formatado (compatibilidade, caso algum link antigo/externo ainda use o formato
        // com pontuacao) - normaliza para digitos antes de comparar.
        String digitsOnly = workspaceDocumentId.replaceAll("\\D", "");
        Workspace workspace = workspaceRepository.findByDocumentIdDigitsOnly(digitsOnly).orElse(null);
        if (workspace == null) {
            return new PublicPrivacyPolicyResponseDTO(false, null, null, null);
        }

        return documentRepository.findFirstByWorkspaceIdAndTypeAndIsPublishedTrue(workspace.getId(), DocumentType.POLITICA_PRIVACIDADE)
                .map(doc -> new PublicPrivacyPolicyResponseDTO(true, workspace.getName(), doc.getGeneratedContent(), doc.getPublishedAt()))
                .orElse(new PublicPrivacyPolicyResponseDTO(false, workspace.getName(), null, null));
    }

}