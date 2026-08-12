ALTER TABLE documents
    ADD COLUMN review_recommended BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN review_recommended_reason VARCHAR(255);