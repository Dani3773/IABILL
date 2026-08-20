package com.projeto.assistant.repository;

import com.projeto.assistant.model.Document;
import com.projeto.assistant.model.DocumentStatus;
import com.projeto.assistant.model.DocumentType;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByWorkspaceId(UUID workspaceId);

    // Usado para sinalizar documentos ja "fechados" (com conteudo gerado) quando
    // um documento novo e ingerido no mesmo workspace - documentos ainda em DRAFT
    // (sem conteudo) nao fazem sentido sinalizar, ja que nao ha nada revisado neles.
    List<Document> findByWorkspaceIdAndStatusIn(UUID workspaceId, List<DocumentStatus> statuses);

    java.util.Optional<Document> findFirstByWorkspaceIdAndTypeAndIsPublishedTrue(UUID workspaceId, DocumentType type);
}