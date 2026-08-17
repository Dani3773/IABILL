ALTER TABLE users
    ADD COLUMN password_reset_token VARCHAR(64),
    ADD COLUMN password_reset_expires_at TIMESTAMPTZ;