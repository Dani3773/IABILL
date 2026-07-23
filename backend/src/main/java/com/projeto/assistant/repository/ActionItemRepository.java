package com.projeto.assistant.repository;

import com.projeto.assistant.model.ActionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActionItemRepository extends JpaRepository<ActionItem, UUID> {

    List<ActionItem> findByWorkspaceId(UUID workspaceId);
}