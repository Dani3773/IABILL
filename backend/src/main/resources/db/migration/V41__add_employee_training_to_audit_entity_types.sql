ALTER TABLE audit_logs
DROP CONSTRAINT chk_audit_logs_entity_type;

ALTER TABLE audit_logs
    ADD CONSTRAINT chk_audit_logs_entity_type
        CHECK (entity_type IN (
                               'TENANT', 'USER', 'WORKSPACE', 'DOCUMENT', 'DOCUMENT_CHUNK',
                               'ACTION_ITEM', 'INCIDENT', 'DATA_SUBJECT_REQUEST', 'PROCESSING_ACTIVITY',
                               'VENDOR', 'EMPLOYEE', 'TRAINING'
            ));