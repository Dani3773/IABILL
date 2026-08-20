CREATE TABLE sectors (
                         id UUID PRIMARY KEY,
                         workspace_id UUID NOT NULL REFERENCES workspaces(id),
                         name VARCHAR(150) NOT NULL,
                         created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sectors_workspace ON sectors(workspace_id);

ALTER TABLE employees DROP COLUMN department;
ALTER TABLE employees ADD COLUMN sector_id UUID REFERENCES sectors(id);

ALTER TABLE processing_activities ADD COLUMN sector_id UUID REFERENCES sectors(id);
ALTER TABLE vendors ADD COLUMN sector_id UUID REFERENCES sectors(id);