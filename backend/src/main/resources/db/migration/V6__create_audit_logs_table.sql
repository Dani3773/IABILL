CREATE TABLE audit_logs (
                            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            tenant_id       UUID NOT NULL,
                            user_id         UUID,              -- NULL permitido: pode ser uma acao automatica do sistema (ex: job de IA agendado)
                            action          VARCHAR(30) NOT NULL,
                            entity_type     VARCHAR(30) NOT NULL,
                            entity_id       UUID NOT NULL,
                            metadata        JSONB,             -- contexto extra (ex: modelo de IA usado, campos alterados, etc.)
                            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

                            CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
                            CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
                            CONSTRAINT chk_audit_logs_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'AI_GENERATE', 'AI_REVIEW', 'APPROVE', 'EXPORT')),
    CONSTRAINT chk_audit_logs_entity_type CHECK (entity_type IN ('TENANT', 'USER', 'WORKSPACE', 'DOCUMENT', 'DOCUMENT_CHUNK'))
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs (tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

COMMENT ON TABLE audit_logs IS 'Trilha de auditoria imutavel - registrada pelo sistema, nunca diretamente pelo cliente da API';