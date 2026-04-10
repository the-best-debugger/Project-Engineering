# Observations — DB Level Validation (FocusForge)

## Issues found in the original schema

Running `invalid_data.sql` (or `constraints_test.sql`) against the unconstrained schema showed that PostgreSQL accepted bad data:

1. **NULL task title** — `tasks.title` had no `NOT NULL`, so a row could be created with no identifiable label.
2. **Duplicate user email** — `users.email` was not `UNIQUE`, so two users could share `alice@email.com`.
3. **Invalid priority** — `tasks.priority` was a plain `INT` with no range check, so `10` was stored even though the product rule is priorities **1–5**.
4. **Orphan task** — `tasks.project_id` had no `FOREIGN KEY`, so a task could point at `project_id = 999` when no such project exists.

Together, these gaps let invalid rows into the database; application code alone cannot guarantee consistency if direct SQL or bugs bypass the app layer.

## Constraints implemented

| Constraint | Location | Business rule |
|------------|----------|----------------|
| `NOT NULL` | `users.name`, `users.email`, `projects.project_name`, `tasks.title` | Every user must have a name and email; every project a name; every task a title. |
| `UNIQUE` | `users.email` | One account per email address. |
| `CHECK` | `tasks.priority` | Priority must be between **1** and **5** (inclusive). |
| `FOREIGN KEY` | `tasks.project_id` → `projects(id)` | Every task belongs to an existing project. |
| `NOT NULL` (supporting FK) | `tasks.priority`, `tasks.project_id` | Ensures every task has a priority and a real project reference (no silent NULLs that skip checks). |

## Result — what the database rejects vs accepts

**Rejects (with PostgreSQL constraint errors):**

- Inserts that set `tasks.title` to `NULL` → *not-null violation*.
- A second user with the same `email` as an existing row → *unique violation*.
- `tasks.priority` outside **1–5** (e.g. `10`) → *check violation*.
- `tasks.project_id` referencing a non-existent `projects.id` (e.g. `999`) → *foreign key violation*.

**Still accepts:**

- All rows in `sample_data.sql` — non-null required fields, distinct emails, priorities `2` and `3`, and `project_id` values `1` and `2` that exist in `projects`.

## How to verify locally (PostgreSQL / `psql`)

```text
\i schema/schema.sql
\i schema/sample_data.sql
\i schema/constraints_test.sql   -- expect four errors, zero successful inserts from this file
```

Screenshots for submission: run each test statement **one at a time** (or use the four blocks in `constraints_test.sql` separately) so each screenshot shows one clear error: NOT NULL, UNIQUE, CHECK, and FOREIGN KEY.
