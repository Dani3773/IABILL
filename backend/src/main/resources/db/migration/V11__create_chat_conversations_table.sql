CREATE TABLE chat_conversations (
                                    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    workspace_id    UUID NOT NULL,
                                    user_id         UUID NOT NULL,
                                    title           VARCHAR(255),
                                    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                                    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

                                    CONSTRAINT fk_chat_conversations_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
                                    CONSTRAINT fk_chat_conversations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_conversations_workspace_user ON chat_conversations (workspace_id, user_id);

COMMENT ON TABLE chat_conversations IS 'Conversas de chat com o agente - privadas por usuario, isoladas entre si (sem memoria cruzada)';