ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN email_verification_token VARCHAR(64),
    ADD COLUMN email_verification_expires_at TIMESTAMPTZ;

-- DEFAULT true acima "perdoa" todos os usuarios ja existentes (nao ficam
-- travados por uma feature nova). Novas contas via signup terao esse
-- valor explicitamente sobrescrito para false no codigo Java.