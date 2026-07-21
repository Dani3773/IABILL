CREATE TABLE documents (
                           id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           workspace_id    UUID NOT NULL,
                           created_by      UUID NOT NULL,
                           type            VARCHAR(40)  NOT NULL,
                           title           VARCHAR(255) NOT NULL,
                           status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
                           created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
                           updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

                           CONSTRAINT fk_documents_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
                           CONSTRAINT fk_documents_created_by FOREIGN KEY (created_by) REFERENCES users (id),
                           CONSTRAINT chk_documents_type CHECK (type IN ('INVENTARIO_DADOS', 'POLITICA_PRIVACIDADE', 'RELATORIO_CONFORMIDADE', 'RAT')),
                           CONSTRAINT chk_documents_status CHECK (status IN ('DRAFT', 'GENERATED', 'REVIEWED', 'APPROVED'))
);

CREATE INDEX idx_documents_workspace_id ON documents (workspace_id);

COMMENT ON TABLE documents IS 'Documentos de conformidade gerados/rascunhados por workspace (inventario, RAT, politicas, relatorios)';