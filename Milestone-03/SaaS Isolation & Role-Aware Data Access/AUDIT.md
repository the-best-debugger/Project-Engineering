# CorpFlow — Pre-Refactor Audit (Move 1)

This document was written **before** schema and API changes. Each item is the contract that subsequent moves address.

---

## Multi-tenancy & data isolation

| # | Problem | Table / object | Consequence if unfixed |
|---|---------|----------------|-------------------------|
| A1 | No `tenants` table exists; organisations (e.g. Pouch vs Velocity) are implied only by email domains in seed data, not enforced in the database. | *(schema-wide)* | Any query can treat the database as a single global org; there is no first-class tenant boundary. |
| A2 | The `users` table has **no `tenant_id` column**. | `users` (lines 8–15 in original `schema.sql`) | `SELECT * FROM users` returns **every user across all organisations**; a missing `WHERE` in application code leaks cross-tenant PII. |
| A3 | The `projects` table has **no `tenant_id` column**. | `projects` (lines 17–23) | `GET /projects` maps to `SELECT * FROM projects` and exposes **all customers’ projects** in one list. |
| A4 | The `billing_details` table has **no `tenant_id` column**. | `billing_details` (lines 25–32) | Billing rows cannot be scoped to an organisation at the row level; reporting or dumps mix tenants. |
| A5 | There is **no project–user assignment** table. | *(missing)* | “User sees only assigned projects” cannot be enforced in SQL or API without ad-hoc rules; every employee effectively sees all projects once listed. |

---

## Referential integrity & cross-tenant references

| # | Problem | Location | Consequence if unfixed |
|---|---------|----------|-------------------------|
| R1 | `billing_details.user_id` references `users(id)` **only** — not `(id, tenant_id)`. | `billing_details.user_id` → `users(id)` | A row could theoretically point at a `user_id` that exists while **billing** is stored under a different tenant row if `tenant_id` were added naïvely without composite keys. |
| R2 | `projects` has **no foreign key to `users`**, so there is no schema-level story for “project belongs to tenant A’s user”. | `projects` | Even after adding `tenant_id`, nothing prevents application bugs from attaching a project to the wrong org’s workflow unless FKs align tenant boundaries. |
| R3 | No **`UNIQUE (id, tenant_id)`** (or equivalent) on tenant-scoped parents, so composite FKs from children cannot enforce “same tenant” in the database. | `users`, `projects` | Child tables cannot use PostgreSQL composite foreign keys to guarantee **child.tenant_id = parent.tenant_id** for `user_id` / `project_id`. |

---

## Sensitive fields & exposure

| # | Field | Table | Risk |
|---|-------|-------|------|
| S1 | `salary` | `users` | Payroll data; must not appear for Manager or User API consumers. |
| S2 | `password_hash` | `users` | Credential material; must **never** appear in JSON responses (any role). |
| S3 | `card_last4` | `billing_details` | PCI-related / payment fingerprint; Admin-only in API responses. |
| S4 | `card_holder_name` | `billing_details` | PII tied to payment method; Admin-only. |
| S5 | `expiry_date` | `billing_details` | Card metadata; Admin-only. |
| S6 | `billing_address` | `billing_details` | Full address PII; Admin-only. |
| S7 | `budget` | `projects` | Financial planning data; treat as **restricted for User** (employee): see assigned projects without detailed budget where policy requires; **Manager and Admin** may see budget (documented in SECURITY.md). |

### Role access matrix (target behaviour)

| Field / resource | Admin | Manager | User (`employee`) |
|------------------|-------|---------|-------------------|
| All users in tenant | Yes | Yes (list) | No — **own user row only** |
| `salary` | Yes | **No** | **No** |
| `password_hash` | **Never in API** | **Never** | **Never** |
| Billing fields | Yes (tenant) | **No** | **No** |
| All projects in tenant | Yes | Yes | **No** — **assigned projects only** |
| Project `budget` | Yes | Yes | **Omitted** in API |

*Schema roles used in seed data: `admin`, `manager`, `employee` — mapped to Admin, Manager, User respectively.*

---

## API-layer issues (pre-refactor)

| # | Problem | File / route | Consequence |
|---|---------|--------------|-------------|
| P1 | `SELECT * FROM users` returns **all columns** including `salary` and `password_hash`. | `routes/users.js` `GET /` and `GET /:id` | Sensitive fields leak to any client that can call the API. |
| P2 | No `tenant_id` filter on user or project queries. | `routes/users.js`, `routes/projects.js` | Cross-tenant data exposure. |
| P3 | No role-based filtering of JSON shape. | same | Managers and employees receive the same payload as admins. |
| P4 | `projects` router uses `console.err` (typo) on error path. | `routes/projects.js` `GET /:id` | Error handler may throw instead of logging; poor reliability. |
| P5 | No endpoint exists for billing, but billing data in DB would be equally unsafe if exposed the same way. | *(n/a)* | Any future route would repeat the same mistakes unless policy is centralized. |

---

## Indexing

| # | Problem | Consequence |
|---|---------|-------------|
| I1 | No indexes on tenant filter columns. | Large tables: slow `WHERE tenant_id = $1` for every request; higher risk of timeouts and operational workarounds that bypass filters. |

---

## Summary

The original schema and API assumed a **single-tenant** world: no `tenant_id`, no composite tenant-safe foreign keys, no assignment model for projects, and **raw `SELECT *`** to clients including **password hashes and salaries**. The fixes add **tenants**, **tenant-scoped rows**, **composite FKs** where relationships cross tables, **assignment** for least-privilege project visibility, **indexes** for tenant predicates, and a **single response-mapping layer** so sensitive fields never reach disallowed roles.
