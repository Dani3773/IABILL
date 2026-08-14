ALTER TABLE workspaces
    ADD COLUMN neighborhood VARCHAR(150),
    ADD COLUMN postal_code  VARCHAR(20),
ALTER COLUMN country TYPE VARCHAR(100);