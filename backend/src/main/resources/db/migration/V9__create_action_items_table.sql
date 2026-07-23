CREATE TABLE action_items (
                              id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              workspace_id    UUID NOT NULL,
                              title           VARCHAR(255) NOT NULL,
                              description     TEXT,
                              status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                              source          VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
                              created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                              updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

                              CONSTRAINT fk_action_items_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
                              CONSTRAINT chk_action_items_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE')),
                              CONSTRAINT chk_action_items_source CHECK (source IN ('MANUAL', 'AI_SUGGESTED'))
);

CREATE INDEX idx_action_items_workspace_id ON action_items (workspace_id);

COMMENT ON TABLE action_items IS 'Plano de acao para adequacao - tarefas de conformidade (nao documentos), podendo ser criadas manualmente ou sugeridas por IA e aprovadas por humano';