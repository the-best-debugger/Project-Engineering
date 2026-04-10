# FocusForge — DB Level Validation

Small PostgreSQL exercise: a broken schema allowed invalid rows; the fixed `schema/schema.sql` enforces **NOT NULL**, **UNIQUE**, **CHECK**, and **FOREIGN KEY** rules at the database.

## Repository layout

| File | Purpose |
|------|---------|
| `schema/schema.sql` | Creates `users`, `projects`, `tasks` **with** integrity constraints. |
| `schema/sample_data.sql` | Valid seed data — must load cleanly after the fixed schema. |
| `schema/invalid_data.sql` | Four invalid inserts (same scenarios as the constraint tests). |
| `schema/constraints_test.sql` | Four inserts — each must **fail** after the fix (use for screenshots / grading). |
| `Observations.md` | What was wrong, what was added, and what the DB now rejects. |

## Quick test (`psql`)

```bash
createdb focusforge_validation   # or any database name
psql -d focusforge_validation -f schema/schema.sql
psql -d focusforge_validation -f schema/sample_data.sql
psql -d focusforge_validation -f schema/constraints_test.sql
```

The last command should produce **four** constraint-violation errors and no successful inserts from those statements.

## Screenshots (submission)

Capture one terminal screenshot per failing insert (see `Observations.md`):

- `screenshot_1_not_null.png` — NULL task title  
- `screenshot_2_unique.png` — duplicate email  
- `screenshot_3_check.png` — priority `10`  
- `screenshot_4_foreign_key.png` — `project_id = 999`  
