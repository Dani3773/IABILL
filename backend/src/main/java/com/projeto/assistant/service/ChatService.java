package com.projeto.assistant.service;

import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.ActionItemSource;
import com.projeto.assistant.model.DocumentType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_TOOL_CALL_ROUNDS = 5;

    private final GeminiFunctionCallingService geminiFunctionCallingService;
    private final DocumentService documentService;
    private final DocumentChunkService documentChunkService;
    private final ActionItemService actionItemService;

    @Transactional
    public ChatResponseDTO sendMessage(ChatRequestDTO request, UUID authTenantId, UUID authUserId) {
        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", buildSystemContext(request.workspaceId()) + "\n\nMensagem do usuário: " + request.message()))
        ));

        List<Map<String, Object>> tools = buildToolDeclarations();
        List<String> actionsTaken = new ArrayList<>();

        for (int round = 0; round < MAX_TOOL_CALL_ROUNDS; round++) {
            Map<String, Object> modelContent = geminiFunctionCallingService.generateWithTools(contents, tools);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) modelContent.get("parts");

            Map<String, Object> functionCallPart = parts.stream()
                    .filter(p -> p.containsKey("functionCall"))
                    .findFirst()
                    .orElse(null);

            if (functionCallPart == null) {
                // Sem chamada de ferramenta - a IA respondeu com texto final.
                String replyText = parts.stream()
                        .filter(p -> p.containsKey("text"))
                        .map(p -> (String) p.get("text"))
                        .findFirst()
                        .orElse("(sem resposta)");
                return new ChatResponseDTO(replyText, actionsTaken);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> functionCall = (Map<String, Object>) functionCallPart.get("functionCall");
            String functionName = (String) functionCall.get("name");
            @SuppressWarnings("unchecked")
            Map<String, Object> args = (Map<String, Object>) functionCall.get("args");

            Object functionResult = executeFunction(functionName, args, request.workspaceId(), authTenantId, authUserId, actionsTaken);

            // Adiciona a chamada de funcao do modelo E o resultado da execucao ao historico,
            // para o Gemini continuar a conversa com base no que realmente aconteceu.
            contents.add(Map.of("role", "model", "parts", List.of(functionCallPart)));
            contents.add(Map.of(
                    "role", "function",
                    "parts", List.of(Map.of("functionResponse", Map.of(
                            "name", functionName,
                            "response", Map.of("result", functionResult)
                    )))
            ));
        }

        return new ChatResponseDTO("Desculpe, não consegui concluir a solicitação em tempo hábil.", actionsTaken);
    }

    private Object executeFunction(String functionName, Map<String, Object> args, UUID workspaceId, UUID authTenantId, UUID authUserId, List<String> actionsTaken) {
        return switch (functionName) {
            case "buscar_documentos" -> {
                String query = (String) args.get("query");
                var results = documentChunkService.semanticSearch(workspaceId, query, 5, authTenantId);
                actionsTaken.add("Buscou informações nos documentos: \"" + query + "\"");
                yield results;
            }
            case "criar_documento" -> {
                String title = (String) args.get("title");
                DocumentType type = DocumentType.valueOf((String) args.get("type"));
                var doc = documentService.create(new DocumentRequestDTO(workspaceId, authUserId, type, title));
                actionsTaken.add("Criou o documento \"" + title + "\"");
                yield doc;
            }
            case "gerar_conteudo_documento" -> {
                UUID documentId = UUID.fromString((String) args.get("documentId"));
                String instruction = (String) args.get("instruction");
                var generation = documentChunkService.generateAssistedContent(documentId, instruction, authTenantId, authUserId);
                actionsTaken.add("Gerou conteúdo para o documento com IA");
                yield generation;
            }
            case "criar_tarefa" -> {
                String title = (String) args.get("title");
                String description = (String) args.getOrDefault("description", "");
                var item = actionItemService.create(
                        new ActionItemRequestDTO(workspaceId, title, description, ActionItemSource.MANUAL),
                        authTenantId, authUserId);
                actionsTaken.add("Criou a tarefa \"" + title + "\" no plano de ação");
                yield item;
            }
            case "listar_tarefas" -> {
                var items = actionItemService.findByWorkspace(workspaceId, authTenantId);
                actionsTaken.add("Consultou o plano de ação");
                yield items;
            }
            case "listar_documentos" -> {
                var docs = documentService.findByWorkspace(workspaceId, authTenantId);
                actionsTaken.add("Consultou a lista de documentos");
                yield docs;
            }
            default -> Map.of("error", "Função desconhecida: " + functionName);
        };
    }

    private String buildSystemContext(UUID workspaceId) {
        return """
                Você é o assistente virtual do IABill, um sistema de apoio à adequação à LGPD/RGPD.
                Você está conversando com um usuário sobre o workspace de ID %s.
                Use as ferramentas disponíveis para consultar documentos, criar documentos, gerar conteúdo,
                e gerenciar o plano de ação de conformidade quando o usuário solicitar.
                Sempre confirme com clareza o que você fez, e nunca invente informações que não estejam
                nos documentos da empresa.
                """.formatted(workspaceId);
    }

    private List<Map<String, Object>> buildToolDeclarations() {
        return List.of(
                Map.of(
                        "name", "buscar_documentos",
                        "description", "Busca trechos relevantes nos documentos existentes do workspace, usando busca semântica",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of("query", Map.of("type", "string", "description", "O que buscar")),
                                "required", List.of("query")
                        )
                ),
                Map.of(
                        "name", "criar_documento",
                        "description", "Cria um novo documento de conformidade (metadados apenas, sem conteúdo ainda)",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "title", Map.of("type", "string"),
                                        "type", Map.of("type", "string", "enum", List.of("INVENTARIO_DADOS", "POLITICA_PRIVACIDADE", "RELATORIO_CONFORMIDADE", "RAT"))
                                ),
                                "required", List.of("title", "type")
                        )
                ),
                Map.of(
                        "name", "gerar_conteudo_documento",
                        "description", "Gera conteúdo via IA para um documento já existente, dado o ID do documento e uma instrução",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "documentId", Map.of("type", "string"),
                                        "instruction", Map.of("type", "string")
                                ),
                                "required", List.of("documentId", "instruction")
                        )
                ),
                Map.of(
                        "name", "criar_tarefa",
                        "description", "Cria uma nova tarefa manual no plano de ação de conformidade",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "title", Map.of("type", "string"),
                                        "description", Map.of("type", "string")
                                ),
                                "required", List.of("title")
                        )
                ),
                Map.of(
                        "name", "listar_tarefas",
                        "description", "Lista todas as tarefas do plano de ação do workspace atual",
                        "parameters", Map.of("type", "object", "properties", Map.of())
                ),
                Map.of(
                        "name", "listar_documentos",
                        "description", "Lista todos os documentos existentes do workspace atual",
                        "parameters", Map.of("type", "object", "properties", Map.of())
                )
        );
    }
}