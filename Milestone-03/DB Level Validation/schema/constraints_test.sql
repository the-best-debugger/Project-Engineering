-- Constraint verification: each INSERT below must FAIL after schema.sql is fixed.
-- Expected failures: NOT NULL (title), UNIQUE (email), CHECK (priority), FOREIGN KEY (project_id).

-- Test 1 — NOT NULL on tasks.title
INSERT INTO tasks (id, title, priority, project_id)
VALUES (3, NULL, 3, 1);

-- Test 2 — UNIQUE on users.email
INSERT INTO users (id, name, email)
VALUES (3, 'Charlie', 'alice@email.com');

-- Test 3 — CHECK on tasks.priority (must be 1–5)
INSERT INTO tasks (id, title, priority, project_id)
VALUES (4, 'Testing Task', 10, 1);

-- Test 4 — FOREIGN KEY tasks.project_id → projects.id
INSERT INTO tasks (id, title, priority, project_id)
VALUES (5, 'Ghost Task', 2, 999);
