ALTER TABLE documents
    ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN published_at TIMESTAMPTZ;