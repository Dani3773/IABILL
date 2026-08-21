ALTER TABLE users
    ADD COLUMN is_dpo_substitute BOOLEAN NOT NULL DEFAULT false;