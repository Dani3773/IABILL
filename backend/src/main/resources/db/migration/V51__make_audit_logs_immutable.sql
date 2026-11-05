-- Torna a trilha de auditoria imutavel no proprio banco: registros so podem ser inseridos.
-- Efeito colateral intencional: as FKs de audit_logs (ON DELETE CASCADE em tenants e
-- ON DELETE SET NULL em users) passam a falhar, entao tenants e usuarios com historico
-- de auditoria nao podem ser apagados.
CREATE FUNCTION prevent_audit_logs_changes() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs e imutavel: operacao % nao permitida', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_logs_changes();

-- TRUNCATE nao dispara triggers de linha e precisa de um trigger proprio.
CREATE TRIGGER trg_audit_logs_no_truncate
    BEFORE TRUNCATE ON audit_logs
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_logs_changes();
