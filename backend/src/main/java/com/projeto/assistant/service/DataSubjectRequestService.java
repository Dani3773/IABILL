package com.projeto.assistant.service;

import com.projeto.assistant.dto.*;
import com.projeto.assistant.model.*;
import com.projeto.assistant.repository.ActionItemRepository;
import com.projeto.assistant.repository.DataSubjectRequestRepository;
import com.projeto.assistant.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DataSubjectRequestService {

    private final DataSubjectRequestRepository dataSubjectRequestRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ActionItemRepository actionItemRepository;
    private final AuditLogService auditLogService;

    // Endpoint publico sem autenticacao - so retorna o nome, nunca o objeto Workspace
    // inteiro. Falha silenciosa (found=false) se o CNPJ nao existir ou for invalido,
    // mesmo padrao ja usado no CnpjLookupService.
    @Transactional(readOnly = true)
    public PublicWorkspaceInfoDTO lookupWorkspaceByDocumentId(String documentId) {
        return workspaceRepository.findByDocumentId(documentId)
                .map(w -> new PublicWorkspaceInfoDTO(true, w.getName()))
                .orElse(new PublicWorkspaceInfoDTO(false, null));
    }

    // Submissao publica - sem authTenantId/authUserId, pois o titular nunca tem conta.
    // Cria automaticamente um ActionItem vinculado no workspace correspondente, para
    // que a solicitacao apareca no Plano de Acao normal da empresa.
    @Transactional
    public DataSubjectRequestResponseDTO submit(String documentId, DataSubjectRequestSubmissionDTO request) {
        Workspace workspace = workspaceRepository.findByDocumentId(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Empresa não encontrada"));

        DataSubjectRequest dsr = new DataSubjectRequest();
        dsr.setWorkspace(workspace);
        dsr.setRequesterName(request.requesterName());
        dsr.setRequesterEmail(request.requesterEmail());
        dsr.setRequesterDocumentId(request.requesterDocumentId());
        dsr.setRequestType(request.requestType());
        dsr.setDescription(request.description());

        DataSubjectRequest saved = dataSubjectRequestRepository.save(dsr);

        ActionItem actionItem = new ActionItem();
        actionItem.setWorkspace(workspace);
        actionItem.setTitle("Solicitação de titular: " + request.requestType().name());
        actionItem.setDescription(
                "Solicitação recebida via portal público de " + request.requesterName()
                        + " (" + request.requesterEmail() + "). Descrição: " + request.description());
        actionItem.setSource(ActionItemSource.MANUAL);
        ActionItem savedActionItem = actionItemRepository.save(actionItem);

        saved.setLinkedActionItemId(savedActionItem.getId());
        DataSubjectRequest finalSaved = dataSubjectRequestRepository.save(saved);

        // Auditoria registrada no tenant do workspace, mesmo sem usuario autenticado -
        // acao do "sistema" em nome de um titular externo, sem authUserId (null).
        auditLogService.record(
                workspace.getTenant().getId(),
                null,
                AuditAction.CREATE,
                AuditEntityType.DATA_SUBJECT_REQUEST,
                finalSaved.getId(),
                Map.of("requestType", request.requestType().name(), "requesterEmail", request.requesterEmail())
        );

        return DataSubjectRequestResponseDTO.fromEntity(finalSaved);
    }

    @Transactional(readOnly = true)
    public List<DataSubjectRequestResponseDTO> findByWorkspace(UUID workspaceId, UUID authTenantId) {
        getValidatedWorkspace(workspaceId, authTenantId);

        return dataSubjectRequestRepository.findByWorkspaceId(workspaceId)
                .stream()
                .map(DataSubjectRequestResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public DataSubjectRequestResponseDTO updateStatus(UUID id, DataSubjectRequestStatusUpdateDTO request, UUID authTenantId, UUID authUserId) {
        DataSubjectRequest dsr = getValidatedRequest(id, authTenantId);

        if (request.status() == DataSubjectRequestStatus.REJECTED && (request.rejectionReason() == null || request.rejectionReason().isBlank())) {
            throw new IllegalArgumentException("Motivo da rejeição é obrigatório");
        }

        DataSubjectRequestStatus previous = dsr.getStatus();
        dsr.setStatus(request.status());
        dsr.setRejectionReason(request.status() == DataSubjectRequestStatus.REJECTED ? request.rejectionReason() : null);
        DataSubjectRequest saved = dataSubjectRequestRepository.save(dsr);

        auditLogService.record(authTenantId, authUserId, AuditAction.UPDATE, AuditEntityType.DATA_SUBJECT_REQUEST, id,
                Map.of("statusChange", previous + " -> " + request.status()));

        return DataSubjectRequestResponseDTO.fromEntity(saved);
    }

    private DataSubjectRequest getValidatedRequest(UUID id, UUID authTenantId) {
        DataSubjectRequest dsr = dataSubjectRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Solicitação não encontrada: " + id));

        if (!dsr.getWorkspace().getTenant().getId().equals(authTenantId)) {
            throw new AccessDeniedException("Você não tem acesso a esta solicitação");
        }

        return dsr;
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