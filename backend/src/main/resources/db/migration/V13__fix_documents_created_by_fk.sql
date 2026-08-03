ALTER TABLE documents ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE documents DROP CONSTRAINT fk_documents_created_by;

ALTER TABLE documents ADD CONSTRAINT fk_documents_created_by
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL;

COMMENT ON COLUMN documents.created_by IS 'Usuario que criou o documento - pode ser NULL se o usuario foi removido do sistema (o documento permanece valido mesmo sem essa referencia)';