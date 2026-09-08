ALTER TABLE vendors
    ADD COLUMN involves_international_transfer BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN destination_country VARCHAR(100),
    ADD COLUMN transfer_safeguard VARCHAR(50),
    ADD COLUMN transfer_safeguard_details TEXT;