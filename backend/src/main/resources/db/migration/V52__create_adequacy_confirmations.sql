CREATE TABLE adequacy_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    item VARCHAR(40) NOT NULL,
    confirmed_by_user_id UUID NOT NULL REFERENCES users(id),
    confirmed_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_adequacy_confirmation UNIQUE (workspace_id, item),
    CONSTRAINT chk_adequacy_confirmation_item CHECK (item IN (
        'DIAGNOSTICO', 'COMITE', 'ENCARREGADO_PUBLICADO', 'SEM_FORNECEDORES',
        'CANAL_TITULAR', 'PLANO_INCIDENTES', 'REVISAO_PERIODICA'
    ))
);

CREATE INDEX idx_adequacy_confirmations_workspace ON adequacy_confirmations(workspace_id);

ALTER TABLE audit_logs
DROP CONSTRAINT chk_audit_logs_entity_type;

ALTER TABLE audit_logs
    ADD CONSTRAINT chk_audit_logs_entity_type
        CHECK (entity_type IN (
                               'TENANT', 'USER', 'WORKSPACE', 'DOCUMENT', 'DOCUMENT_CHUNK',
                               'ACTION_ITEM', 'INCIDENT', 'DATA_SUBJECT_REQUEST', 'PROCESSING_ACTIVITY',
                               'VENDOR', 'EMPLOYEE', 'TRAINING', 'SECTOR', 'ADEQUACY_CONFIRMATION'
            ));
