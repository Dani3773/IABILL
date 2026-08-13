package com.projeto.assistant.repository;

import com.projeto.assistant.model.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    List<Workspace> findByTenantId(UUID tenantId);

    Optional<Workspace> findByDocumentId(String documentId);
}