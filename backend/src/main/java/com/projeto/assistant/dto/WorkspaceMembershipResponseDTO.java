package com.projeto.assistant.dto;

import com.projeto.assistant.model.Workspace;

import java.util.UUID;

public record WorkspaceMembershipResponseDTO(
        UUID workspaceId,
        String workspaceName,
        String workspaceType
) {
    public static WorkspaceMembershipResponseDTO fromEntity(Workspace workspace) {
        return new WorkspaceMembershipResponseDTO(
                workspace.getId(),
                workspace.getName(),
                workspace.getType().name()
        );
    }
}