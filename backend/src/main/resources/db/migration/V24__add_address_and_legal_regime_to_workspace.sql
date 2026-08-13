ALTER TABLE workspaces
    ADD COLUMN country         VARCHAR(2),
    ADD COLUMN state           VARCHAR(100),
    ADD COLUMN city            VARCHAR(100),
    ADD COLUMN street          VARCHAR(255),
    ADD COLUMN address_number  VARCHAR(20),
    ADD COLUMN phone           VARCHAR(30);

CREATE TABLE workspace_legal_regimes (
                                         workspace_id  UUID NOT NULL,
                                         legal_regime  VARCHAR(10) NOT NULL,

                                         PRIMARY KEY (workspace_id, legal_regime),
                                         CONSTRAINT fk_wlr_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
                                         CONSTRAINT chk_wlr_legal_regime CHECK (legal_regime IN ('LGPD', 'RGPD'))
);

COMMENT ON TABLE workspace_legal_regimes IS 'Regimes legais aplicaveis a cada workspace (multipla escolha) - extensivel para novos regimes futuros (ex: CCPA)';