ALTER TABLE processing_activities
    ADD COLUMN applicable_regime VARCHAR(10) NOT NULL DEFAULT 'LGPD';

ALTER TABLE processing_activities
    ADD CONSTRAINT chk_processing_activities_regime
        CHECK (applicable_regime IN ('LGPD', 'RGPD'));

ALTER TABLE processing_activities
    ALTER COLUMN applicable_regime DROP DEFAULT;