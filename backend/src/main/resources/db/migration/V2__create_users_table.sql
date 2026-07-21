CREATE TABLE users (
                       id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       tenant_id       UUID NOT NULL,
                       username        VARCHAR(255) NOT NULL,
                       email           VARCHAR(255) NOT NULL,
                       password_hash   VARCHAR(255) NOT NULL,
                       role            VARCHAR(20)  NOT NULL,
                       created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
                       updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

                       CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
                       CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'USER')),

    -- O e-mail precisa ser único DENTRO do tenant, não globalmente.
    -- Isso permite que duas empresas diferentes tenham usuários com o mesmo e-mail
    -- (ex: um consultor que atende múltiplas empresas com contas separadas).
                       CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users (tenant_id);

COMMENT ON TABLE users IS 'Usuários do sistema, sempre vinculados a um tenant (isolamento multi-tenant)';