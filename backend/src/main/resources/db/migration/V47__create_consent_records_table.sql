CREATE TABLE consent_records (
                                 id UUID PRIMARY KEY,
                                 processing_activity_id UUID NOT NULL REFERENCES processing_activities(id),
                                 consenter_name VARCHAR(200) NOT NULL,
                                 consenter_email VARCHAR(255) NOT NULL,
                                 consent_text_snapshot TEXT NOT NULL,
                                 ip_address VARCHAR(45),
                                 consented_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_consent_records_activity ON consent_records(processing_activity_id);