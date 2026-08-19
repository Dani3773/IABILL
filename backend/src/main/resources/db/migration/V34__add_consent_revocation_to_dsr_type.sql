ALTER TABLE data_subject_requests
DROP CONSTRAINT chk_dsr_request_type;

ALTER TABLE data_subject_requests
    ADD CONSTRAINT chk_dsr_request_type
        CHECK (request_type IN (
                                'ACCESS', 'CORRECTION', 'DELETION', 'PORTABILITY', 'ANONYMIZATION', 'CONSENT_REVOCATION'
            ));