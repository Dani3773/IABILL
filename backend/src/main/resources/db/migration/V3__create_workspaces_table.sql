CREATE TABLE workspaces (
                            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            tenant_id       UUID NOT NULL,
                            name            VARCHAR(255) NOT NULL,
                            type            VARCHAR(20)  NOT NULL,
                            document_id     VARCHAR(32)  NOT NULL, -- CNPJ específico dessa unidade (matriz ou filial)
                            created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
                            updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

                            CONSTRAINT fk_workspaces_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
                            CONSTRAINT chk_workspaces_type CHECK (type IN ('MATRIZ', 'FILIAL')),

    -- O CNPJ da unidade é único DENTRO do tenant (duas empresas diferentes
    -- não deveriam colidir, mas isso já é garantido pelo tenant_id)
                            CONSTRAINT uq_workspaces_tenant_document UNIQUE (tenant_id, document_id)
);

CREATE INDEX idx_workspaces_tenant_id ON workspaces (tenant_id);

COMMENT ON TABLE workspaces IS 'Unidades operacionais (matriz/filial) dentro de um tenant, cada uma com seu proprio inventario de dados e RAT';

-- Tabela de junção: um User pode acessar vários Workspaces, e um Workspace pode ter vários Users
CREATE TABLE user_workspaces (
                                 user_id         UUID NOT NULL,
                                 workspace_id    UUID NOT NULL,
                                 created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

                                 PRIMARY KEY (user_id, workspace_id),
                                 CONSTRAINT fk_user_workspaces_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                                 CONSTRAINT fk_user_workspaces_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
);

COMMENT ON TABLE user_workspaces IS 'Relacao muitos-para-muitos: quais workspaces cada usuario pode acessar';