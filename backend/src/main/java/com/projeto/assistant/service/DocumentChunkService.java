package com.projeto.assistant.service;

import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.DocumentChunk;
import com.projeto.assistant.repository.DocumentChunkRepository;
import com.projeto.assistant.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.projeto.assistant.dto.SemanticSearchResultDTO;
import com.projeto.assistant.model.Workspace;
import com.projeto.assistant.repository.WorkspaceRepository;
import org.springframework.security.access.AccessDeniedException;
import com.projeto.assistant.dto.DocumentGenerationResponseDTO;
import com.projeto.assistant.model.DocumentStatus;
import com.projeto.assistant.model.AuditAction;
import com.projeto.assistant.model.AuditEntityType;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentChunkService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final TextChunker textChunker;
    private final GeminiEmbeddingService geminiEmbeddingService;
    private final WorkspaceRepository workspaceRepository;
    private final AuditLogService auditLogService;
    private final GeminiGenerationService geminiGenerationService;

    // Recebe o texto bruto de um documento, quebra em pedacos, gera embedding
    // de cada um via Gemini, e salva tudo vinculado ao Document.
    @Transactional
    public int processContent(UUID documentId, String rawContent) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + documentId));

        // Remove chunks antigos, caso o conteudo esteja sendo reprocessado
        documentChunkRepository.deleteAll(document.getChunks());
        document.getChunks().clear();

        List<String> pieces = textChunker.chunk(rawContent);

        for (int i = 0; i < pieces.size(); i++) {
            String piece = pieces.get(i);
            float[] embedding = geminiEmbeddingService.embed(piece);

            DocumentChunk chunk = new DocumentChunk();
            chunk.setDocument(document);
            chunk.setChunkIndex(i);
            chunk.setContent(piece);
            chunk.setEmbedding(embedding);

            documentChunkRepository.save(chunk);
        }

        return pieces.size();
    }

    @Transactional(readOnly = true)
    public List<SemanticSearchResultDTO> semanticSearch(UUID workspaceId, String query, int limit, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        float[] queryEmbedding = geminiEmbeddingService.embed(query);
        String vectorLiteral = toVectorLiteral(queryEmbedding);

        return documentChunkRepository.findNearestChunks(workspaceId, vectorLiteral, limit)
                .stream()
                .map(chunk -> new SemanticSearchResultDTO(
                        chunk.getDocument().getId(),
                        chunk.getDocument().getTitle(),
                        chunk.getChunkIndex(),
                        chunk.getContent()
                ))
                .toList();
    }

    private String toVectorLiteral(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    @Transactional
    public DocumentGenerationResponseDTO generateAssistedContent(UUID documentId, String instruction, UUID authTenantId, UUID authUserId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + documentId));

        UUID workspaceId = document.getWorkspace().getId();

        if (!document.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este documento");
        }

        // Passo 1 (Retrieval): busca os trechos mais relevantes do proprio workspace
        List<SemanticSearchResultDTO> relevantChunks = semanticSearch(workspaceId, instruction, 5, authTenantId);

        String context = relevantChunks.stream()
                .map(SemanticSearchResultDTO::content)
                .reduce("", (a, b) -> a + "\n\n---\n\n" + b);

        // Passo 2 (Augmented): monta o prompt com o contexto recuperado
        String prompt = """
            Você é um assistente que ajuda a redigir documentos de conformidade com a LGPD/RGPD.
            Use SOMENTE as informações de contexto abaixo para responder.
            Se a informação necessária não estiver no contexto, diga claramente que não há dados suficientes - NUNCA invente informações.

            Contexto:
            %s

            Instrução: %s

            Redija o conteúdo solicitado de forma clara e objetiva:
            """.formatted(context, instruction);

        // Passo 3 (Generation): chama o Gemini
        String generatedText = geminiGenerationService.generate(prompt);

        document.setGeneratedContent(generatedText);
        document.setStatus(DocumentStatus.GENERATED);
        documentRepository.save(document);

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.AI_GENERATE,
                AuditEntityType.DOCUMENT,
                documentId,
                Map.of("instruction", instruction, "chunksUsed", relevantChunks.size())
        );

        return new DocumentGenerationResponseDTO(documentId, generatedText, DocumentStatus.GENERATED);
    }
}