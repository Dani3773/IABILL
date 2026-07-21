CREATE TABLE document_chunks (
                                 id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                 document_id     UUID NOT NULL,
                                 chunk_index     INT  NOT NULL,
                                 content         TEXT NOT NULL,
                                 embedding       vector(768), -- dimensao do modelo text-embedding-004 do Gemini

                                 CONSTRAINT fk_document_chunks_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
                                 CONSTRAINT uq_document_chunks_order UNIQUE (document_id, chunk_index)
);

-- Indice HNSW para busca por similaridade (cosseno) - o algoritmo padrao mais usado em RAG
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);

COMMENT ON TABLE document_chunks IS 'Pedacos de texto de cada documento com embedding vetorial, usados para busca semantica (RAG)';