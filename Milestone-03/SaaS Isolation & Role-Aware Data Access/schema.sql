-- CorpFlow — multi-tenant schema with tenant boundaries and composite FKs (PostgreSQL)
-- Run: psql -f schema.sql (or npm run seed)

DROP TABLE IF EXISTS project_assignments;
DROP TABLE IF EXISTS billing_details;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee',
    salary DECIMAL(10, 2),
    UNIQUE (id, tenant_id)
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    budget DECIMAL(12, 2),
    UNIQUE (id, tenant_id)
);

-- Billing rows are tenant-scoped; user_id must reference a user in the SAME tenant (composite FK).
CREATE TABLE billing_details (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    card_holder_name VARCHAR(100),
    card_last4 VARCHAR(4),
    expiry_date VARCHAR(5),
    billing_address TEXT,
    FOREIGN KEY (user_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE CASCADE
);

-- Which users may see which projects (User role = assigned only).
CREATE TABLE project_assignments (
    tenant_id INTEGER NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (tenant_id, project_id, user_id),
    FOREIGN KEY (project_id, tenant_id) REFERENCES projects (id, tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE CASCADE
);

-- Composite indexes for tenant-scoped queries (Move 7)
CREATE INDEX idx_users_tenant_id ON users (tenant_id);
CREATE INDEX idx_users_tenant_email ON users (tenant_id, email);

CREATE INDEX idx_projects_tenant_id ON projects (tenant_id);
CREATE INDEX idx_projects_tenant_status ON projects (tenant_id, status);

CREATE INDEX idx_billing_tenant_id ON billing_details (tenant_id);
CREATE INDEX idx_billing_tenant_user ON billing_details (tenant_id, user_id);

CREATE INDEX idx_assignments_tenant_user ON project_assignments (tenant_id, user_id);
CREATE INDEX idx_assignments_tenant_project ON project_assignments (tenant_id, project_id);

-- Seed tenants
INSERT INTO tenants (id, name, slug) VALUES
(1, 'Pouch Inc', 'pouch'),
(2, 'Velocity Labs', 'velocity');

SELECT setval(pg_get_serial_sequence('tenants', 'id'), (SELECT MAX(id) FROM tenants));

-- Seed users (tenant-aligned with original story: alice/bob @ pouch, charlie/david @ velocity)
INSERT INTO users (id, tenant_id, full_name, email, password_hash, role, salary) VALUES
(1, 1, 'Alice Johnson', 'alice@pouch.io', 'pbkdf2:sha256:600000$hasher$81726a', 'admin', 125000.00),
(2, 1, 'Bob Smith', 'bob@pouch.io', 'pbkdf2:sha256:600000$hasher$81726b', 'manager', 95000.00),
(3, 2, 'Charlie Davis', 'charlie@velocity.com', 'pbkdf2:sha256:600000$hasher$81726c', 'admin', 140000.00),
(4, 2, 'David Miller', 'david@velocity.com', 'pbkdf2:sha256:600000$hasher$81726d', 'employee', 75000.00);

SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));

-- Projects: each row belongs to exactly one tenant (Pouch Portal -> pouch, Velocity projects -> velocity)
INSERT INTO projects (id, tenant_id, name, description, status, budget) VALUES
(1, 1, 'Pouch Portal', 'Customer portal for Pouch.io', 'active', 50000.00),
(2, 2, 'Velocity Engine', 'Back-end engine for Velocity', 'active', 120000.00),
(3, 2, 'Secret R&D', NULL, 'inactive', 250000.00);

SELECT setval(pg_get_serial_sequence('projects', 'id'), (SELECT MAX(id) FROM projects));

INSERT INTO billing_details (tenant_id, user_id, card_holder_name, card_last4, expiry_date, billing_address) VALUES
(1, 1, 'Alice Johnson', '4242', '12/28', '123 Tech Lane, SF'),
(2, 3, 'Charlie Davis', '9182', '08/26', '789 Velocity Rd, NY');

-- Assignments: admins/managers see all tenant projects via API; employees only where assigned
INSERT INTO project_assignments (tenant_id, project_id, user_id) VALUES
(1, 1, 1),
(1, 1, 2),
(2, 2, 3),
(2, 2, 4),
(2, 3, 3);
