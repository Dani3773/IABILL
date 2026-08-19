CREATE TABLE employees (
                           id UUID PRIMARY KEY,
                           workspace_id UUID NOT NULL REFERENCES workspaces(id),
                           name VARCHAR(200) NOT NULL,
                           job_title VARCHAR(150),
                           department VARCHAR(150),
                           email VARCHAR(255),
                           active BOOLEAN NOT NULL DEFAULT true,
                           created_by UUID REFERENCES users(id),
                           created_at TIMESTAMPTZ NOT NULL,
                           updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_employees_workspace ON employees(workspace_id);