package com.projeto.assistant.repository;

import com.projeto.assistant.model.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;
import java.util.List;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {
    // Busca em todas as unidades (matriz e filiais) da mesma empresa: as politicas
    // da matriz valem para as filiais, e a IA de uma unidade enxerga os documentos
    // aprovados das outras. O filtro por empresa fica dentro da consulta, antes da
    // ordenacao por semelhanca, entao trechos de outra empresa nunca sao candidatos.
    @Query(value = """
        SELECT dc.* FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        JOIN workspaces w ON w.id = d.workspace_id
        WHERE w.tenant_id = :tenantId
        ORDER BY dc.embedding <=> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<DocumentChunk> findNearestChunksInTenant(
            @Param("tenantId") UUID tenantId,
            @Param("queryEmbedding") String queryEmbedding,
            @Param("limit") int limit);

    // Exclusao direta por document_id, sem depender da colecao document.getChunks()
    @Modifying
    @Query(value = "DELETE FROM document_chunks WHERE document_id = :documentId", nativeQuery = true)
    void deleteByDocumentId(@Param("documentId") UUID documentId);
}