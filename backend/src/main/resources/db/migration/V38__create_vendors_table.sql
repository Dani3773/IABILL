CREATE TABLE vendors (
                         id UUID PRIMARY KEY,
                         workspace_id UUID NOT NULL REFERENCES workspaces(id),
                         name VARCHAR(200) NOT NULL,
                         service_provided TEXT NOT NULL,
                         shared_data_categories TEXT NOT NULL,
                         dpa_signed BOOLEAN NOT NULL DEFAULT false,
                         dpa_signed_at DATE,
                         security_clauses_confirmed BOOLEAN NOT NULL DEFAULT false,
                         observations TEXT,
                         created_by UUID REFERENCES users(id),
                         created_at TIMESTAMPTZ NOT NULL,
                         updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_vendors_workspace ON vendors(workspace_id);