ALTER TABLE audit_logs DROP CONSTRAINT chk_audit_logs_action;

ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_action
    CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'AI_GENERATE', 'AI_REVIEW', 'APPROVE', 'EXPORT', 'REJECT'));