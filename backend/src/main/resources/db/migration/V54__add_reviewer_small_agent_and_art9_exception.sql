-- Quem marcou o documento como revisado: a aprovação passa a exigir outra pessoa
-- sempre que a empresa tiver mais de um Administrador (segregação de funções).
ALTER TABLE documents
    ADD COLUMN reviewed_by UUID REFERENCES users (id) ON DELETE SET NULL;

-- Agente de tratamento de pequeno porte (Resolução CD/ANPD 2/2022): prazos em dobro,
-- inclusive o de comunicação de incidente à ANPD e aos titulares.
ALTER TABLE workspaces
    ADD COLUMN small_processing_agent BOOLEAN NOT NULL DEFAULT FALSE;

-- Exceção do Art. 9.º, n.º 2 do RGPD usada para tratar categorias especiais de dados.
ALTER TABLE processing_activities
    ADD COLUMN special_category_exception VARCHAR(40);
