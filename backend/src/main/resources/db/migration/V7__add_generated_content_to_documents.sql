ALTER TABLE documents ADD COLUMN generated_content TEXT;

COMMENT ON COLUMN documents.generated_content IS 'Rascunho de conteudo gerado pela IA - sempre passa por revisao humana antes de aprovacao (status GENERATED -> REVIEWED -> APPROVED)';