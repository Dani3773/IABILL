package com.projeto.assistant.repository;

import com.projeto.assistant.model.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;
import java.util.List;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {

    @Query(value = """
        SELECT dc.* FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE d.workspace_id = :workspaceId
        ORDER BY dc.embedding <=> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<DocumentChunk> findNearestChunks(
            @Param("workspaceId") UUID workspaceId,
            @Param("queryEmbedding") String queryEmbedding,
            @Param("limit") int limit);

}