package com.projeto.assistant.evaluation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projeto.assistant.IntegrationTestBase;
import com.projeto.assistant.dto.DocumentGenerationResponseDTO;
import com.projeto.assistant.dto.SemanticSearchResultDTO;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.DocumentRepository;
import com.projeto.assistant.repository.TenantRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import com.projeto.assistant.service.DocumentChunkService;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.junit.jupiter.api.TestInstance;
import org.springframework.test.context.TestPropertySource;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Harness de avaliacao quantitativa do pipeline RAG do IABill - versao AUTOCONTIDA (Opcao A).
 *
 * O proprio @BeforeAll cria um Tenant/Workspace/Documentos fixture e chama
 * DocumentChunkService.processContent (que usa o Gemini REAL para gerar embeddings) -
 * por isso este teste esta marcado com @Tag("evaluation") e deve ser EXCLUIDO do
 * gate padrao de CI/CD (./mvnw test), rodando manualmente via:
 *
 *   ./mvnw test -Dgroups=evaluation -Dtest=RagEvaluationTest
 *
 * Consome dezenas de chamadas de IA por execucao (40 embeddings de ingestao +
 * embeddings de busca para cada consulta positiva + geracoes para os casos
 * negativos) - excede o limite padrao de 30/hora do RateLimiterService, por
 * isso a classe sobrescreve app.rate-limit.ai-actions-per-hour via
 * @TestPropertySource. Evite rodar em loop apertado mesmo assim.
 *
 * Saida: rag-evaluation-results.csv, consumido por evaluate_rag_metrics.py.
 */
@Tag("evaluation")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestPropertySource(properties = "app.rate-limit.ai-actions-per-hour=200")
class RagEvaluationTest extends IntegrationTestBase {

    private static final int TOP_K = 5;

    @Autowired private DocumentChunkService documentChunkService;
    @Autowired private DocumentRepository documentRepository;
    @Autowired private WorkspaceRepository workspaceRepository;
    @Autowired private TenantRepository tenantRepository;
    @Autowired private UserRepository userRepository;

    private static JsonNode dataset;
    private static final List<Map<String, Object>> resultRows = new ArrayList<>();

    // Estado do fixture, montado uma vez e reaproveitado pelos dois metodos de teste
    private static UUID tenantId;
    private static UUID workspacePopuladoId;
    private static UUID workspaceVazioId;
    private static UUID authUserId;
    private static UUID documentoVazioId;
    private static final Map<String, UUID> fixtureDocIds = new HashMap<>();

    @BeforeAll
    void montarFixtureEIngestarDocumentos() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        Path path = Path.of("src/test/resources/golden_dataset.json");
        dataset = mapper.readTree(Files.newInputStream(path));

        // --- Tenant + User fixture (nao passa pelo AuthService, save() direto e seguro) ---
        Tenant tenant = new Tenant();
        tenant.setName("Empresa Fixture Avaliacao RAG");
        tenant.setDocumentId("00000000000099");
        tenant.setCountry("BR");
        tenant = tenantRepository.save(tenant);
        tenantId = tenant.getId();

        User user = new User();
        user.setTenant(tenant);
        user.setUsername("fixture.eval");
        user.setEmail("fixture-eval@iabill-test.com");
        user.setPasswordHash("nao-sera-usado-para-login");
        user.setRole(UserRole.ADMIN);
        user = userRepository.save(user);
        authUserId = user.getId();

        // --- Dois workspaces: um vai receber os documentos ingeridos, outro fica vazio ---
        Workspace workspacePopulado = new Workspace();
        workspacePopulado.setTenant(tenant);
        workspacePopulado.setName("Workspace Populado (fixture)");
        workspacePopulado.setType(WorkspaceType.MATRIZ);
        workspacePopulado.setDocumentId("00000000000098");
        workspacePopulado = workspaceRepository.save(workspacePopulado);
        workspacePopuladoId = workspacePopulado.getId();

        Workspace workspaceVazio = new Workspace();
        workspaceVazio.setTenant(tenant);
        workspaceVazio.setName("Workspace Vazio (fixture)");
        workspaceVazio.setType(WorkspaceType.FILIAL);
        workspaceVazio.setDocumentId("00000000000097");
        workspaceVazio = workspaceRepository.save(workspaceVazio);
        workspaceVazioId = workspaceVazio.getId();

        // --- Ingestao real: cria Document + chama processContent (Gemini real) ---
        for (JsonNode fixtureDoc : dataset.get("fixture_documents")) {
            String docKey = fixtureDoc.get("doc_key").asText();
            String rawContent = fixtureDoc.get("raw_content").asText();

            Document document = new Document();
            document.setWorkspace(workspacePopulado);
            document.setType(DocumentType.valueOf(fixtureDoc.get("type").asText()));
            document.setTitle(fixtureDoc.get("title").asText());
            document = documentRepository.save(document);

            int chunkCount = documentChunkService.processContent(document.getId(), rawContent, authUserId);

            // Assuncao critica: cada texto de fixture deve virar exatamente 1 chunk.
            // Se o TextChunker dividir diferente, este assert falha com mensagem clara
            // em vez de silenciosamente comparar chunk_index errado depois.
            if (chunkCount != 1) {
                throw new IllegalStateException(
                        "Fixture '" + docKey + "' gerou " + chunkCount + " chunks, esperado 1. " +
                                "O TextChunker dividiu o texto de forma diferente do assumido - " +
                                "encurte o raw_content deste fixture ou ajuste este harness para " +
                                "lidar com multiplos chunks por documento.");
            }

            fixtureDocIds.put(docKey, document.getId());
        }

        // --- Documento "vazio": existe, mas nunca passou por processContent (0 chunks) ---
        Document documentoVazio = new Document();
        documentoVazio.setWorkspace(workspaceVazio);
        documentoVazio.setType(DocumentType.RELATORIO_CONFORMIDADE);
        documentoVazio.setTitle("[fixture] documento sem chunks ingeridos");
        documentoVazio = documentRepository.save(documentoVazio);
        documentoVazioId = documentoVazio.getId();
    }

    @Test
    @Order(1)
    void avaliarCasosPositivos() {
        for (JsonNode testCase : dataset.get("positive_cases")) {
            String id = testCase.get("id").asText();
            String query = testCase.get("query").asText();

            Set<String> expectedKeys = new HashSet<>();
            for (JsonNode expected : testCase.get("expected_chunks")) {
                UUID docId = fixtureDocIds.get(expected.get("doc_key").asText());
                // ATENCAO: campo no JSON chama "doc_key" - ver nota abaixo do metodo
                expectedKeys.add(docId + "::" + expected.get("chunk_index").asInt());
            }

            List<SemanticSearchResultDTO> results = documentChunkService
                    .semanticSearch(workspacePopuladoId, query, TOP_K, tenantId);

            List<String> retrievedKeys = results.stream()
                    .map(r -> r.documentId().toString() + "::" + r.chunkIndex())
                    .collect(Collectors.toList());

            double precisionAtK = precisionAtK(retrievedKeys, expectedKeys);
            double recallAtK = recallAtK(retrievedKeys, expectedKeys);
            double reciprocalRank = reciprocalRank(retrievedKeys, expectedKeys);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("case_id", id);
            row.put("type", "positive");
            row.put("category", testCase.get("category").asText());
            row.put("query", query);
            row.put("precision_at_k", precisionAtK);
            row.put("recall_at_k", recallAtK);
            row.put("reciprocal_rank", reciprocalRank);
            resultRows.add(row);
        }
    }

    @Test
    @Order(2)
    void avaliarCasosNegativos() {
        for (JsonNode testCase : dataset.get("negative_cases")) {
            String id = testCase.get("id").asText();
            String query = testCase.get("query").asText();
            String expectedBehavior = testCase.get("expected_behavior").asText();
            String workspaceAlvo = testCase.get("workspace").asText(); // "vazio" ou "populado"

            UUID documentIdParaTeste = workspaceAlvo.equals("vazio")
                    ? documentoVazioId
                    : fixtureDocIds.values().iterator().next(); // qualquer doc do workspace populado

            DocumentGenerationResponseDTO response = documentChunkService
                    .generateAssistedContent(documentIdParaTeste, query, tenantId, authUserId);

            boolean recusouCorretamente = contemFraseDeRecusa(response.generatedContent());

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("case_id", id);
            row.put("type", "negative");
            row.put("expected_behavior", expectedBehavior);
            row.put("query", query);
            row.put("recusou_corretamente", recusouCorretamente);
            row.put("generated_text_preview",
                    response.generatedContent().substring(0, Math.min(150, response.generatedContent().length())));
            resultRows.add(row);
        }
    }

    private boolean contemFraseDeRecusa(String textoGerado) {
        String normalizado = textoGerado.toLowerCase();
        List<String> sinaisDeRecusa = List.of(
                "contexto insuficiente", "não há dados suficientes", "nao ha dados suficientes",
                "não foi possível encontrar", "nao foi possivel encontrar",
                "não há informações", "nao ha informacoes"
        );
        return sinaisDeRecusa.stream().anyMatch(normalizado::contains);
    }

    @AfterAll
    static void exportarCsv() throws IOException {
        if (resultRows.isEmpty()) return;
        Path outputPath = Path.of("rag-evaluation-results.csv");
        try (FileWriter writer = new FileWriter(outputPath.toFile())) {
            Set<String> allKeys = new LinkedHashSet<>();
            resultRows.forEach(r -> allKeys.addAll(r.keySet()));
            writer.write(String.join(",", allKeys) + "\n");
            for (Map<String, Object> row : resultRows) {
                List<String> values = new ArrayList<>();
                for (String key : allKeys) {
                    String s = row.getOrDefault(key, "").toString().replace(",", ";").replace("\n", " ");
                    values.add(s);
                }
                writer.write(String.join(",", values) + "\n");
            }
        }
        System.out.println("Resultados exportados para: " + outputPath.toAbsolutePath());
    }

    private double precisionAtK(List<String> retrieved, Set<String> expected) {
        if (retrieved.isEmpty()) return 0.0;
        return (double) retrieved.stream().filter(expected::contains).count() / retrieved.size();
    }

    private double recallAtK(List<String> retrieved, Set<String> expected) {
        if (expected.isEmpty()) return 0.0;
        return (double) retrieved.stream().filter(expected::contains).count() / expected.size();
    }

    private double reciprocalRank(List<String> retrieved, Set<String> expected) {
        for (int i = 0; i < retrieved.size(); i++) {
            if (expected.contains(retrieved.get(i))) return 1.0 / (i + 1);
        }
        return 0.0;
    }
}