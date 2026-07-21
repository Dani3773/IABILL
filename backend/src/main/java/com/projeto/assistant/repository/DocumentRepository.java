package com.projeto.assistant.repository;

import com.projeto.assistant.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByWorkspaceId(UUID workspaceId);
}