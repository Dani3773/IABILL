CREATE TABLE processing_activities (
                                       id UUID PRIMARY KEY,
                                       workspace_id UUID NOT NULL REFERENCES workspaces(id),
                                       process_name VARCHAR(200) NOT NULL,
                                       purpose TEXT NOT NULL,
                                       legal_basis VARCHAR(50) NOT NULL,
                                       data_subject_categories TEXT NOT NULL,
                                       personal_data_categories TEXT NOT NULL,
                                       data_sharing TEXT,
                                       security_measures TEXT,
                                       retention_period VARCHAR(200),
                                       involves_sensitive_data BOOLEAN NOT NULL DEFAULT false,
                                       observations TEXT,
                                       created_by UUID REFERENCES users(id),
                                       created_at TIMESTAMPTZ NOT NULL,
                                       updated_at TIMESTAMPTZ NOT NULL,
                                       CONSTRAINT chk_processing_activities_legal_basis CHECK (legal_basis IN (
                                                                                                               'CONSENTIMENTO', 'CUMPRIMENTO_OBRIGACAO_LEGAL', 'EXECUCAO_CONTRATO',
                                                                                                               'EXERCICIO_REGULAR_DE_DIREITOS', 'PROTECAO_DA_VIDA', 'TUTELA_DA_SAUDE',
                                                                                                               'LEGITIMO_INTERESSE', 'PROTECAO_DO_CREDITO', 'EXECUCAO_POLITICAS_PUBLICAS',
                                                                                                               'ESTUDOS_POR_ORGAO_PESQUISA'
                                           ))
);

CREATE INDEX idx_processing_activities_workspace ON processing_activities(workspace_id);