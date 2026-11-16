package com.projeto.assistant.service;

import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.dto.SemanticSearchResultDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.DocumentChunkRepository;
import com.projeto.assistant.repository.DocumentRepository;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

// Escopo da busca semantica: cobre matriz e filiais da mesma empresa, e nunca
// devolve trechos de outra empresa (o isolamento que o RAG precisa garantir).
class SemanticSearchScopeIntegrationTest extends IntegrationTestBase {

    @Autowired private DocumentChunkService documentChunkService;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private WorkspaceRepository workspaceRepository;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private DocumentChunkRepository documentChunkRepository;
    @MockitoBean private GeminiEmbeddingService geminiEmbeddingService;
    @MockitoBean private GeminiGenerationService geminiGenerationService;

    private UUID tenantAId;
    private UUID tenantBId;
    private UUID filialAId;
    private UUID unidadeBId;

    @BeforeEach
    void setUp() {
        // Todo texto vira o mesmo vetor: a ordem por semelhanca empata e so o
        // filtro de empresa decide o que volta.
        when(geminiEmbeddingService.embed(anyString())).thenReturn(vector());

        Tenant tenantA = tenant("Empresa A");
        tenantAId = tenantA.getId();
        Workspace matrizA = workspace(tenantA, "Matriz A", WorkspaceType.MATRIZ);
        filialAId = workspace(tenantA, "Filial A", WorkspaceType.FILIAL).getId();
        chunk(matrizA, "Politica de privacidade da matriz A");

        Tenant tenantB = tenant("Empresa B");
        tenantBId = tenantB.getId();
        Workspace unidadeB = workspace(tenantB, "Unidade B", WorkspaceType.MATRIZ);
        unidadeBId = unidadeB.getId();
        chunk(unidadeB, "Dado confidencial da empresa B");
    }

    @Test
    void filialEncontraDocumentosDaMatrizDaMesmaEmpresa() {
        List<SemanticSearchResultDTO> results = documentChunkService.semanticSearch(filialAId, "privacidade", 5, tenantAId);

        assertThat(results).isNotEmpty();
        assertThat(results).allMatch(r -> r.workspaceName().equals("Matriz A"));
    }

    @Test
    void buscaNuncaDevolveTrechoDeOutraEmpresa() {
        List<SemanticSearchResultDTO> results = documentChunkService.semanticSearch(filialAId, "confidencial", 50, tenantAId);

        assertThat(results).noneMatch(r -> r.content().contains("empresa B"));
        assertThat(results).noneMatch(r -> r.workspaceName().equals("Unidade B"));
    }

    @Test
    void unidadeDeOutraEmpresaEhNegada() {
        assertThatThrownBy(() -> documentChunkService.semanticSearch(unidadeBId, "qualquer", 5, tenantAId))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void semDocumentoAprovadoNaEmpresaRecusaSemChamarOModelo() {
        Tenant vazia = tenant("Empresa sem documentos");
        Workspace unidade = workspace(vazia, "Unidade vazia", WorkspaceType.MATRIZ);
        Document rascunho = new Document();
        rascunho.setWorkspace(unidade);
        rascunho.setType(DocumentType.POLITICA_PRIVACIDADE);
        rascunho.setTitle("Rascunho");
        rascunho.setStatus(DocumentStatus.DRAFT);
        rascunho = documentRepository.save(rascunho);
        UUID documentoId = rascunho.getId();

        assertThatThrownBy(() -> documentChunkService.generateAssistedContent(documentoId, "politica de privacidade", vazia.getId(), UUID.randomUUID()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(DocumentChunkService.NO_CONTEXT_MESSAGE);
        verifyNoInteractions(geminiGenerationService);
    }

    private Tenant tenant(String name) {
        Tenant tenant = new Tenant();
        tenant.setName(name);
        tenant.setDocumentId(randomDocumentId());
        tenant.setCountry("BR");
        return tenantRepository.save(tenant);
    }

    private Workspace workspace(Tenant tenant, String name, WorkspaceType type) {
        Workspace workspace = new Workspace();
        workspace.setTenant(tenant);
        workspace.setName(name);
        workspace.setType(type);
        workspace.setDocumentId(randomDocumentId());
        return workspaceRepository.save(workspace);
    }

    private void chunk(Workspace workspace, String content) {
        Document document = new Document();
        document.setWorkspace(workspace);
        document.setType(DocumentType.POLITICA_PRIVACIDADE);
        document.setTitle("Documento de " + workspace.getName());
        document = documentRepository.save(document);

        DocumentChunk chunk = new DocumentChunk();
        chunk.setDocument(document);
        chunk.setChunkIndex(0);
        chunk.setContent(content);
        chunk.setEmbedding(vector());
        documentChunkRepository.save(chunk);
    }

    private static float[] vector() {
        float[] v = new float[768];
        v[0] = 1f;
        return v;
    }

    private static String randomDocumentId() {
        return String.valueOf(Math.abs(UUID.randomUUID().getMostSignificantBits())).substring(0, 14);
    }
}
