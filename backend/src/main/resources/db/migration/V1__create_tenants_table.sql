CREATE TABLE tenants (
                         id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         name            VARCHAR(255) NOT NULL,
                         document_id     VARCHAR(32)  NOT NULL, -- CNPJ (Brasil) ou NIF (Espanha/Portugal)
                         country         VARCHAR(2)   NOT NULL, -- ISO 3166-1 alpha-2, ex: 'BR', 'ES'
                         created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
                         updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

                         CONSTRAINT uq_tenants_document_id UNIQUE (document_id)
);

COMMENT ON TABLE tenants IS 'Empresas (locatários) que utilizam a plataforma - base do isolamento multi-tenant';