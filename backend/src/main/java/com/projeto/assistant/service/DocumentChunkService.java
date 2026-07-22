package com.projeto.assistant.service;

import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.DocumentChunk;
import com.projeto.assistant.repository.DocumentChunkRepository;
import com.projeto.assistant.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentChunkService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final TextChunker textChunker;
    private final GeminiEmbeddingService geminiEmbeddingService;

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
}