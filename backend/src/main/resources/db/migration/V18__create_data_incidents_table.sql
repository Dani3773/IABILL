CREATE TABLE data_incidents (
                                id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                workspace_id                UUID NOT NULL,
                                created_by                  UUID,
                                title                       VARCHAR(255) NOT NULL,
                                description                 TEXT NOT NULL,
                                affected_data_categories    TEXT NOT NULL,
                                estimated_affected_count    INTEGER,
                                severity                    VARCHAR(20) NOT NULL,
                                status                      VARCHAR(30) NOT NULL,
                                discovered_at               TIMESTAMPTZ NOT NULL,
                                occurred_at                 TIMESTAMPTZ,
                                anpd_notified_at            TIMESTAMPTZ,
                                data_subjects_notified_at   TIMESTAMPTZ,
                                mitigation_measures         TEXT,
                                created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
                                updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

                                CONSTRAINT fk_incidents_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
                                CONSTRAINT fk_incidents_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
                                CONSTRAINT chk_incidents_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
                                CONSTRAINT chk_incidents_status CHECK (status IN ('IDENTIFIED', 'ASSESSING', 'ANPD_NOTIFIED', 'DATA_SUBJECTS_NOTIFIED', 'RESOLVED'))
);

CREATE INDEX idx_incidents_workspace_id ON data_incidents (workspace_id);

COMMENT ON TABLE data_incidents IS 'Registros de incidentes/vazamentos de dados pessoais, conforme Art. 48 da LGPD';