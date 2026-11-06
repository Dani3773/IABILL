package com.projeto.assistant.service;

import com.projeto.assistant.config.MessageCatalog;
import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.ChatConversationRepository;
import com.projeto.assistant.repository.ChatMessageRepository;
import com.projeto.assistant.repository.UserRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
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
    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final RateLimiterService rateLimiterService;

    @Transactional
    public ChatConversationResponseDTO createConversation(UUID workspaceId, UUID authTenantId, UUID authUserId) {
        Workspace workspace = getValidatedWorkspace(workspaceId, authTenantId);
        User user = userRepository.findById(authUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + authUserId));

        ChatConversation conversation = new ChatConversation();
        conversation.setWorkspace(workspace);
        conversation.setUser(user);

        ChatConversation saved = conversationRepository.save(conversation);
        return ChatConversationResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponseDTO> listConversations(UUID workspaceId, UUID authTenantId, UUID authUserId) {
        getValidatedWorkspace(workspaceId, authTenantId);

        return conversationRepository.findByWorkspaceIdAndUserIdOrderByUpdatedAtDesc(workspaceId, authUserId)
                .stream()
                .map(ChatConversationResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponseDTO> getMessages(UUID conversationId, UUID authTenantId, UUID authUserId) {
        ChatConversation conversation = getValidatedConversation(conversationId, authTenantId, authUserId);

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(ChatMessageResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public ChatMessageResponseDTO sendMessage(UUID conversationId, String userMessageText, UUID authTenantId, UUID authUserId) {
        rateLimiterService.checkAiUsageLimit(authUserId);
        ChatConversation conversation = getValidatedConversation(conversationId, authTenantId, authUserId);
        UUID workspaceId = conversation.getWorkspace().getId();

        List<ChatMessage> existingMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        // Persiste a mensagem do usuario JA, antes de chamar a IA - garante que fica
        // salva mesmo que a chamada ao Gemini falhe.
        ChatMessage userMessage = new ChatMessage();
        userMessage.setConversation(conversation);
        userMessage.setRole(ChatMessageRole.USER);
        userMessage.setContent(userMessageText);
        messageRepository.save(userMessage);

        // Se for a primeira mensagem, define o titulo da conversa a partir dela.
        if (conversation.getTitle() == null) {
            conversation.setTitle(userMessageText.length() > 60 ? userMessageText.substring(0, 60) + "..." : userMessageText);
        }

        List<Map<String, Object>> contents = new ArrayList<>();

        // Reconstroi o historico da conversa a partir do que ja esta salvo no banco -
        // nao depende mais do frontend enviar o historico.
        for (ChatMessage msg : existingMessages) {
            String role = msg.getRole() == ChatMessageRole.USER ? "user" : "model";
            contents.add(Map.of("role", role, "parts", List.of(Map.of("text", msg.getContent()))));
        }

        String textForModel = existingMessages.isEmpty()
                ? buildSystemContext(workspaceId) + "\n" + MessageCatalog.aiLanguageInstruction() + "\n\nMensagem do usuário: " + userMessageText
                : userMessageText;

        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", textForModel))));

        List<Map<String, Object>> tools = buildToolDeclarations();
        List<String> actionsTaken = new ArrayList<>();
        String finalReply = MessageCatalog.t("Desculpe, não consegui concluir a solicitação em tempo hábil.");

        for (int round = 0; round < MAX_TOOL_CALL_ROUNDS; round++) {
            Map<String, Object> modelContent = geminiFunctionCallingService.generateWithTools(contents, tools);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts = (List<Map<String, Object>>) modelContent.get("parts");

            Map<String, Object> functionCallPart = parts.stream()
                    .filter(p -> p.containsKey("functionCall"))
                    .findFirst()
                    .orElse(null);

            if (functionCallPart == null) {
                finalReply = parts.stream()
                        .filter(p -> p.containsKey("text"))
                        .map(p -> (String) p.get("text"))
                        .findFirst()
                        .orElse("(sem resposta)");
                break;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> functionCall = (Map<String, Object>) functionCallPart.get("functionCall");
            String functionName = (String) functionCall.get("name");
            @SuppressWarnings("unchecked")
            Map<String, Object> args = (Map<String, Object>) functionCall.get("args");

            Object functionResult = executeFunction(functionName, args, workspaceId, authTenantId, authUserId, actionsTaken);

            contents.add(Map.of("role", "model", "parts", List.of(functionCallPart)));
            contents.add(Map.of(
                    "role", "function",
                    "parts", List.of(Map.of("functionResponse", Map.of(
                            "name", functionName,
                            "response", Map.of("result", functionResult)
                    )))
            ));
        }

        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setConversation(conversation);
        assistantMessage.setRole(ChatMessageRole.ASSISTANT);
        assistantMessage.setContent(finalReply);
        assistantMessage.setActionsTaken(actionsTaken);
        ChatMessage savedAssistantMessage = messageRepository.save(assistantMessage);

        conversationRepository.save(conversation); // atualiza updated_at (via @PreUpdate) e o titulo, se foi setado agora

        return ChatMessageResponseDTO.fromEntity(savedAssistantMessage);
    }

    private Object executeFunction(String functionName, Map<String, Object> args, UUID workspaceId, UUID authTenantId, UUID authUserId, List<String> actionsTaken) {
        return switch (functionName) {
            case "buscar_documentos" -> {
                String query = (String) args.get("query");
                var results = documentChunkService.semanticSearch(workspaceId, query, 5, authTenantId);
                actionsTaken.add(MessageCatalog.t("Buscou informações nos documentos: \"" + query + "\""));
                yield results;
            }
            case "criar_documento" -> {
                String title = (String) args.get("title");
                DocumentType type = DocumentType.valueOf((String) args.get("type"));
                var doc = documentService.create(new DocumentRequestDTO(workspaceId, type, title), authTenantId, authUserId);
                actionsTaken.add(MessageCatalog.t("Criou o documento \"" + title + "\""));
                yield doc;
            }
            case "gerar_conteudo_documento" -> {
                UUID documentId = UUID.fromString((String) args.get("documentId"));
                String instruction = (String) args.get("instruction");
                // Checagem previa: uma excecao aqui desfaria a transacao da conversa
                // inteira, e o modelo precisa receber o motivo para explicar ao usuario.
                if (documentService.findById(documentId, authTenantId).status() == DocumentStatus.APPROVED) {
                    yield Map.of("erro", "Documento aprovado não pode ser alterado");
                }
                var generation = documentChunkService.generateAssistedContent(documentId, instruction, authTenantId, authUserId);
                actionsTaken.add(MessageCatalog.t("Gerou conteúdo para o documento com IA"));
                yield generation;
            }
            case "criar_tarefa" -> {
                String title = (String) args.get("title");
                String description = (String) args.getOrDefault("description", "");
                var item = actionItemService.create(
                        new ActionItemRequestDTO(workspaceId, title, description, ActionItemSource.MANUAL),
                        authTenantId, authUserId);
                actionsTaken.add(MessageCatalog.t("Criou a tarefa \"" + title + "\" no plano de ação"));
                yield item;
            }
            case "listar_tarefas" -> {
                var items = actionItemService.findByWorkspace(workspaceId, authTenantId);
                actionsTaken.add(MessageCatalog.t("Consultou o plano de ação"));
                yield items;
            }
            case "listar_documentos" -> {
                var docs = documentService.findByWorkspace(workspaceId, authTenantId);
                actionsTaken.add(MessageCatalog.t("Consultou a lista de documentos"));
                yield docs;
            }
            default -> Map.of("error", "Função desconhecida: " + functionName);
        };
    }

    private ChatConversation getValidatedConversation(UUID conversationId, UUID authTenantId, UUID authUserId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversa não encontrada: " + conversationId));

        if (!conversation.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a esta conversa");
        }
        if (!conversation.getUser().getId().equals(authUserId)) {
            throw new AccessDeniedException("Esta conversa pertence a outro usuário");
        }

        return conversation;
    }

    private Workspace getValidatedWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }
        return workspace;
    }

    private String buildSystemContext(UUID workspaceId) {
        return """
            Você é o assistente virtual do IABill, um sistema de apoio à adequação à LGPD/RGPD.
            Você está conversando com um usuário sobre o workspace de ID %s.
            Use as ferramentas disponíveis para consultar documentos, criar documentos, gerar conteúdo,
            e gerenciar o plano de ação de conformidade quando o usuário solicitar.

            IMPORTANTE: quando uma ferramenta retornar uma lista de itens (documentos, tarefas), você deve
            analisar e filtrar essa lista sozinho para responder perguntas específicas do usuário (por status,
            tipo, origem, etc.) usando os dados já retornados. NUNCA diga que "não tem essa funcionalidade" se
            a informação necessária já está disponível na resposta da ferramenta - a resposta pode exigir apenas
            que você observe/conte/filtre os itens já retornados.

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
                        "description", "Lista TODAS as tarefas do plano de acao do workspace atual, incluindo titulo, descricao, status (PENDING, IN_PROGRESS ou DONE) e origem (MANUAL ou AI_SUGGESTED) de cada uma. Use esta ferramenta para responder qualquer pergunta sobre tarefas - incluindo perguntas que exigem filtrar por status ou origem. Analise e filtre a lista retornada para responder exatamente o que foi perguntado, em vez de dizer que nao tem a funcionalidade.",
                        "parameters", Map.of("type", "object", "properties", Map.of())
                ),
                Map.of(
                        "name", "listar_documentos",
                        "description", "Lista TODOS os documentos existentes do workspace atual, incluindo titulo, tipo e status (DRAFT, GENERATED, REVIEWED ou APPROVED) de cada um. Use esta ferramenta para responder qualquer pergunta sobre documentos - incluindo perguntas que exigem filtrar por status (ex: 'quais foram aprovados', 'quantos estao pendentes', 'existe algum rascunho'). Analise e filtre a lista retornada para responder exatamente o que foi perguntado, em vez de dizer que nao tem a funcionalidade.",
                        "parameters", Map.of("type", "object", "properties", Map.of())
                )
        );
    }
}