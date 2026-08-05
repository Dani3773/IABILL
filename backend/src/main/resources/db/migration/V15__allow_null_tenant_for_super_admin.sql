ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

COMMENT ON COLUMN users.tenant_id IS 'NULL apenas para usuarios SUPER_ADMIN (administradores de plataforma, nao vinculados a nenhuma empresa cliente)';