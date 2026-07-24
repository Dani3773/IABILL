CREATE TABLE chat_messages (
                               id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               conversation_id UUID NOT NULL,
                               role            VARCHAR(20) NOT NULL,
                               content         TEXT NOT NULL,
                               actions_taken   JSONB,
                               created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

                               CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations (id) ON DELETE CASCADE,
                               CONSTRAINT chk_chat_messages_role CHECK (role IN ('USER', 'ASSISTANT'))
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages (conversation_id);

COMMENT ON TABLE chat_messages IS 'Mensagens de uma conversa - actions_taken guarda as acoes reais executadas pelo agente em cada resposta';