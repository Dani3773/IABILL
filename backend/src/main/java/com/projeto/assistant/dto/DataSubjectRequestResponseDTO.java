package com.projeto.assistant.dto;

import com.projeto.assistant.model.DataSubjectRequest;
import com.projeto.assistant.model.DataSubjectRequestStatus;
import com.projeto.assistant.model.DataSubjectRequestType;

import java.time.Instant;
import java.util.UUID;

public record DataSubjectRequestResponseDTO(
        UUID id,
        UUID workspaceId,
        String requesterName,
        String requesterEmail,
        String requesterDocumentId,
        DataSubjectRequestType requestType,
        String description,
        DataSubjectRequestStatus status,
        String rejectionReason,
        UUID linkedActionItemId,
        Instant createdAt
) {
    public static DataSubjectRequestResponseDTO fromEntity(DataSubjectRequest r) {
        return new DataSubjectRequestResponseDTO(
                r.getId(),
                r.getWorkspace().getId(),
                r.getRequesterName(),
                r.getRequesterEmail(),
                r.getRequesterDocumentId(),
                r.getRequestType(),
                r.getDescription(),
                r.getStatus(),
                r.getRejectionReason(),
                r.getLinkedActionItemId(),
                r.getCreatedAt()
        );
    }
}