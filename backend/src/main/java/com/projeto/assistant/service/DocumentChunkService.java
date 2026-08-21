package com.projeto.assistant.service;

import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.DocumentChunkRepository;
import com.projeto.assistant.repository.DocumentRepository;
import com.projeto.assistant.dto.DocumentResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.projeto.assistant.dto.SemanticSearchResultDTO;
import com.projeto.assistant.repository.WorkspaceRepository;
import org.springframework.security.access.AccessDeniedException;
import com.projeto.assistant.dto.DocumentGenerationResponseDTO;
import com.projeto.assistant.dto.GeminiGenerationResultDTO;

import java.time.Duration;
import java.time.Instant;
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
    private final RateLimiterService rateLimiterService;

    // Recebe o texto bruto de um documento, quebra em pedacos, gera embedding
    // de cada um via Gemini, e salva tudo vinculado ao Document.
    @Transactional
    public int processContent(UUID documentId, String rawContent, UUID authUserId) {
        rateLimiterService.checkAiUsageLimit(authUserId);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + documentId));

        // Remove chunks antigos, caso o conteudo esteja sendo reprocessado - flush()
        // forca a exclusao a ser gravada no banco IMEDIATAMENTE, antes dos INSERTs
        // novos abaixo. Sem isso, reaprovar um documento pela segunda vez pode tentar
        // inserir chunks com os mesmos indices dos antigos antes de eles serem
        // fisicamente removidos, violando a constraint de unicidade.
        documentChunkRepository.deleteAll(document.getChunks());
        documentChunkRepository.flush();
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
        rateLimiterService.checkAiUsageLimit(authUserId);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + documentId));
        UUID workspaceId = document.getWorkspace().getId();
        if (!document.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este documento");
        }
        // Passo 1 (Retrieval): busca os trechos mais relevantes do proprio workspace,
        // medindo a latencia dessa etapa separada da geracao.
        Instant retrievalStart = Instant.now();
        List<SemanticSearchResultDTO> relevantChunks = semanticSearch(workspaceId, instruction, 5, authTenantId);
        long retrievalLatencyMs = Duration.between(retrievalStart, Instant.now()).toMillis();

        String context = relevantChunks.stream()
                .map(SemanticSearchResultDTO::content)
                .reduce("", (a, b) -> a + "\n\n---\n\n" + b);

        // Documentos-fonte distintos usados como contexto - base para a metrica de
        // "taxa de reutilizacao documental": mede se documentos ja aprovados sao
        // reaproveitados como contexto em geracoes futuras, nao so nesta chamada.
        List<String> sourceDocumentIds = relevantChunks.stream()
                .map(r -> r.documentId().toString())
                .distinct()
                .toList();

        // Passo 2 (Augmented): monta o prompt com o contexto recuperado
        String diretrizesEspecificas = buildTypeSpecificGuidance(document.getType());
        String prompt = """
            Você é um assistente que ajuda a redigir documentos de conformidade com a LGPD/RGPD.
            Use SOMENTE as informações de contexto abaixo para responder.
            Se a informação necessária não estiver no contexto, diga claramente que não há dados suficientes - NUNCA invente informações.
            %s
            Contexto:
            %s
            Instrução: %s
            Redija o conteúdo solicitado de forma clara e objetiva:
            """.formatted(diretrizesEspecificas, context, instruction);

        // Passo 3 (Generation): chama o Gemini, medindo latencia e capturando consumo de tokens
        Instant generationStart = Instant.now();
        GeminiGenerationResultDTO result = geminiGenerationService.generate(prompt);
        long generationLatencyMs = Duration.between(generationStart, Instant.now()).toMillis();

        document.setGeneratedContent(result.text());
        document.setStatus(DocumentStatus.GENERATED);
        documentRepository.save(document);

        auditLogService.record(
                authTenantId,
                authUserId,
                AuditAction.AI_GENERATE,
                AuditEntityType.DOCUMENT,
                documentId,
                Map.of(
                        "instruction", instruction,
                        "chunksUsed", relevantChunks.size(),
                        "sourceDocumentIds", sourceDocumentIds,
                        "retrievalLatencyMs", retrievalLatencyMs,
                        "generationLatencyMs", generationLatencyMs,
                        "promptTokens", result.promptTokenCount(),
                        "candidatesTokens", result.candidatesTokenCount(),
                        "totalTokens", result.totalTokenCount()
                )
        );

        return new DocumentGenerationResponseDTO(documentId, result.text(), DocumentStatus.GENERATED);
    }

    private String buildTypeSpecificGuidance(DocumentType type) {
        if (type == DocumentType.RIPD_DPIA) {
            return """
                Este documento é um Relatório de Impacto à Proteção de Dados (RIPD/DPIA),
                conforme Art. 38 da LGPD. Estruture o conteúdo cobrindo obrigatoriamente,
                quando houver informação disponível no contexto, os seguintes elementos:
                1. Descrição do tratamento de dados pessoais avaliado (finalidade, dados envolvidos, titulares afetados).
                2. Avaliação de necessidade e proporcionalidade do tratamento em relação à finalidade.
                3. Riscos identificados aos direitos e liberdades dos titulares dos dados.
                4. Medidas de mitigação e salvaguardas adotadas ou recomendadas para reduzir os riscos identificados.
                Se o contexto não tiver informação suficiente para algum desses 4 elementos,
                declare explicitamente qual elemento está incompleto - não invente conteúdo para preenchê-lo.
                """;
        }
        if (type == DocumentType.POLITICA_SEGURANCA_INFORMACAO) {
            return """
                Este documento é uma Política de Segurança da Informação (PSI), seguindo as
                boas práticas recomendadas pelo Guia Orientativo sobre Segurança da Informação
                da ANPD para Agentes de Tratamento de Pequeno Porte. Estruture o conteúdo
                cobrindo obrigatoriamente, quando houver informação disponível no contexto, os
                seguintes tópicos:
                1. Política de senhas e autenticação (complexidade exigida, troca periódica, MFA quando aplicável).
                2. Política de backup e recuperação de dados.
                3. Controle de acesso a sistemas e dados pessoais (quem pode acessar o quê, e como isso é revisado).
                4. Compartilhamento de dados com terceiros e fornecedores.
                5. Atualização e manutenção de sistemas e softwares (patches de segurança).
                6. Uso seguro de e-mail e comunicações eletrônicas.
                7. Proteção contra malware/antivírus.
                Se o contexto não tiver informação suficiente para algum desses tópicos,
                declare explicitamente qual tópico está incompleto - não invente conteúdo para preenchê-lo.
                """;
        }
        if (type == DocumentType.MATERIAL_TREINAMENTO) {
            return """
                Este documento é um material de apoio para treinamento e conscientização de
                colaboradores sobre proteção de dados pessoais (LGPD/RGPD). Estruture o
                conteúdo de forma didática, cobrindo, quando houver informação disponível no
                contexto:
                1. Explicação simples do que são dados pessoais e por que protegê-los importa.
                2. Boas práticas no dia a dia relacionadas aos processos REAIS desta empresa
                   (use os processos e categorias de dados do contexto, se disponíveis).
                3. O que fazer em caso de suspeita de incidente/vazamento de dados.
                4. Canais internos para dúvidas sobre proteção de dados.
                Use linguagem acessível, evitando jargão jurídico excessivo - o público-alvo
                são colaboradores sem formação técnica ou jurídica.
                """;
        }
        return "";
    }
}