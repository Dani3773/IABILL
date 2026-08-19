CREATE TABLE trainings (
                           id UUID PRIMARY KEY,
                           workspace_id UUID NOT NULL REFERENCES workspaces(id),
                           title VARCHAR(200) NOT NULL,
                           description TEXT,
                           method VARCHAR(20) NOT NULL,
                           training_date DATE NOT NULL,
                           created_by UUID REFERENCES users(id),
                           created_at TIMESTAMPTZ NOT NULL,
                           updated_at TIMESTAMPTZ NOT NULL,
                           CONSTRAINT chk_trainings_method CHECK (method IN ('PRESENCIAL', 'ONLINE', 'MATERIAL_ESCRITO'))
);

CREATE TABLE training_attendees (
                                    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
                                    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                                    PRIMARY KEY (training_id, employee_id)
);

CREATE INDEX idx_trainings_workspace ON trainings(workspace_id);