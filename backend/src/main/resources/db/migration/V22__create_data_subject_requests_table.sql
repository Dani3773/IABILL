CREATE TABLE data_subject_requests (
                                       id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                       workspace_id            UUID NOT NULL,
                                       requester_name          VARCHAR(255) NOT NULL,
                                       requester_email         VARCHAR(255) NOT NULL,
                                       requester_document_id   VARCHAR(20),
                                       request_type            VARCHAR(20) NOT NULL,
                                       description             TEXT NOT NULL,
                                       status                  VARCHAR(20) NOT NULL,
                                       rejection_reason        TEXT,
                                       linked_action_item_id   UUID,
                                       created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
                                       updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

                                       CONSTRAINT fk_dsr_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
                                       CONSTRAINT fk_dsr_action_item FOREIGN KEY (linked_action_item_id) REFERENCES action_items (id) ON DELETE SET NULL,
                                       CONSTRAINT chk_dsr_request_type CHECK (request_type IN ('ACCESS', 'CORRECTION', 'DELETION', 'PORTABILITY', 'ANONYMIZATION')),
                                       CONSTRAINT chk_dsr_status CHECK (status IN ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'))
);

CREATE INDEX idx_dsr_workspace_id ON data_subject_requests (workspace_id);

COMMENT ON TABLE data_subject_requests IS 'Solicitacoes de titulares de dados (Art. 18 LGPD), recebidas via portal publico sem autenticacao, escopadas por workspace (entidade legal/CNPJ especifico)';