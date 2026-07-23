package com.projeto.assistant.service;

import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.ActionItemRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActionItemService {

    private final ActionItemRepository actionItemRepository;
    private final WorkspaceRepository workspaceRepository;
    private final DocumentChunkService documentChunkService;
    private final GeminiGenerationService geminiGenerationService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ActionItemResponseDTO create(ActionItemRequestDTO request, UUID authTenantId, UUID authUserId) {
        Workspace workspace = getValidatedWorkspace(request.workspaceId(), authTenantId);

        ActionItem item = new ActionItem();
        item.setWorkspace(workspace);
        item.setTitle(request.title());
        item.setDescription(request.description());
        item.setSource(request.source() != null ? request.source() : ActionItemSource.MANUAL);

        ActionItem saved = actionItemRepository.save(item);

        auditLogService.record(authTenantId, authUserId, AuditAction.CREATE, AuditEntityType.ACTION_ITEM, saved.getId(),
                Map.of("title", saved.getTitle(), "source", saved.getSource().name()));

        return ActionItemResponseDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ActionItemResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        getValidatedWorkspace(workspaceId, authTenantId);

        return actionItemRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(ActionItemResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public ActionItemResponseDTO updateStatus(UUID id, ActionItemStatus newStatus, UUID authTenantId, UUID authUserId) {
        ActionItem item = actionItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tarefa não encontrada: " + id));

        if (!item.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a esta tarefa");
        }

        ActionItemStatus previous = item.getStatus();
        item.setStatus(newStatus);
        ActionItem saved = actionItemRepository.save(item);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.ACTION_ITEM, id,
                Map.of("statusChange", previous + " -> " + newStatus));

        return ActionItemResponseDTO.fromEntity(saved);
    }

    // Gera sugestoes via RAG, reaproveitando a MESMA busca semantica usada na geracao
    // de documentos - mas aqui a saida e uma lista estruturada de tarefas, nao um texto.
    // NADA e salvo no banco ainda - o usuario aprova cada sugestao individualmente.
    @Transactional
    public List<SuggestedActionItemDTO> generateSuggestions(UUID workspaceId, UUID authTenantId, UUID authUserId) {
        Workspace workspace = getValidatedWorkspace(workspaceId, authTenantId);

        List<SemanticSearchResultDTO> relevantChunks = documentChunkService.semanticSearch(
                workspaceId, "requisitos de conformidade LGPD adequacao de dados pessoais", 8, authTenantId);

        String context = relevantChunks.stream()
                .map(SemanticSearchResultDTO::content)
                .reduce("", (a, b) -> a + "\n\n---\n\n" + b);

        String prompt = """
                Você é um assistente especializado em conformidade com a LGPD/RGPD.
                Com base no contexto abaixo (extraído de documentos já existentes da empresa),
                sugira de 3 a 6 tarefas concretas e acionáveis (um "plano de ação") que a empresa
                ainda precisa executar para avançar na adequação à LGPD.

                Se o contexto for insuficiente, sugira tarefas genéricas e essenciais de conformidade
                (ex: nomear encarregado de dados, mapear fluxos de dados, etc.), mas nunca invente
                fatos específicos sobre a empresa que não estejam no contexto.

                Contexto:
                %s

                Responda ESTRITAMENTE em formato JSON, como uma lista de objetos, sem nenhum texto
                antes ou depois, sem markdown, EXATAMENTE neste formato:
                [{"title": "...", "description": "..."}, {"title": "...", "description": "..."}]
                """.formatted(context);

        String rawResponse = geminiGenerationService.generate(prompt);
        String cleaned = rawResponse.trim()
                .replaceAll("^```json", "")
                .replaceAll("^```", "")
                .replaceAll("```$", "")
                .trim();

        List<SuggestedActionItemDTO> suggestions;
        try {
            suggestions = objectMapper.readValue(cleaned, objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, SuggestedActionItemDTO.class));
        } catch (Exception e) {
            throw new IllegalStateException("A IA retornou um formato inesperado. Tente novamente.");
        }

        auditLogService.record(authTenantId, authUserId, AuditAction.AI_GENERATE, AuditEntityType.ACTION_ITEM, workspace.getId(),
                Map.of("suggestedCount", suggestions.size()));

        return suggestions;
    }

    private Workspace getValidatedWorkspace(UUID workspaceId, UUID authTenantId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace não encontrado: " + workspaceId));

        if (!workspace.getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a este workspace");
        }

        return workspace;
    }
}