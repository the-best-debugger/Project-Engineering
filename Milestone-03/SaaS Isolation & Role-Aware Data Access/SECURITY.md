# CorpFlow — Security & tenant isolation

This document records **decisions** that implement Moves 4–7 and complements `AUDIT.md`.

## Sensitive fields

| Field | Table | Why sensitive | API exposure |
|-------|-------|----------------|--------------|
| `password_hash` | `users` | Authentication secret | **Never** returned (stripped for all roles in `lib/responsePolicy.js`). |
| `salary` | `users` | Payroll / compensation | **Admin** only. **Manager** and **User** (`employee`) responses omit it. |
| `card_last4` | `billing_details` | Payment instrument fingerprint | **Admin** only, via `GET /users/:id/billing`. |
| `card_holder_name` | `billing_details` | PII tied to card | Admin only (same endpoint). |
| `expiry_date` | `billing_details` | Card metadata | Admin only. |
| `billing_address` | `billing_details` | Location PII | Admin only. |
| `budget` | `projects` | Financial planning | **Omitted for User** (`employee`); **included for Manager and Admin**. |

## Roles (schema ↔ product language)

| DB value (`users.role`) | Product name |
|-------------------------|--------------|
| `admin` | Admin |
| `manager` | Manager |
| `employee` | User |

## Access rules (enforced in API)

| Role | Users | Projects | Billing |
|------|--------|----------|---------|
| **Admin** | All users **in `X-Tenant-Id`**, including `salary` (never `password_hash`) | All projects in tenant, with `budget` | `GET /users/:id/billing` allowed for users in tenant |
| **Manager** | All users in tenant **without** `salary` | All projects in tenant, with `budget` | **Denied** (403) |
| **User** (`employee`) | **Only** own user record, **no** `salary` | **Only** projects linked in `project_assignments` for that user, **no** `budget` | **Denied** (403) |

## Request context (tenant boundary at the HTTP layer)

Every `/users` and `/projects` request **must** include:

- `X-Tenant-Id` — organisation scope  
- `X-User-Id` — acting user (resolved from DB; must belong to that tenant)

`middleware/requireActor.js` loads `SELECT … FROM users WHERE id = $1 AND tenant_id = $2`. If no row matches, the request is **403**. This prevents treating user `4` as belonging to tenant `1` when the DB says otherwise.

## Database-level tenant boundaries

- **`tenants`** is the root of tenancy.
- **`users.tenant_id`**, **`projects.tenant_id`**, **`billing_details.tenant_id`** are **NOT NULL** and reference `tenants(id)`.
- **`UNIQUE (id, tenant_id)`** on `users` and `projects` enables **composite foreign keys** so children cannot point at a parent row from another tenant:
  - `billing_details (user_id, tenant_id) → users (id, tenant_id)`
  - `project_assignments (project_id, tenant_id) → projects (id, tenant_id)`
  - `project_assignments (user_id, tenant_id) → users (id, tenant_id)`

Cross-tenant link attempts fail at **insert/update** time with a foreign-key violation.

## Queries that enforce tenant scope

All list/detail SQL in `routes/users.js` and `routes/projects.js` includes `WHERE tenant_id = $tenantId` (or joins that inherit tenant from `project_assignments`). There is **no** unscoped `SELECT * FROM users` or `projects` in the API.

## Indexes

Composite / tenant-first indexes (see `schema.sql`) support:

- `WHERE tenant_id = ?` on `users`, `projects`, `billing_details`
- assignment lookups `(tenant_id, user_id)` and `(tenant_id, project_id)`

This keeps tenant-scoped queries predictable under growth.

## Residual risks (operational)

- **Header trust**: The API trusts `X-User-Id` as the caller identity. In production, replace with signed JWT / session where **user id and tenant** are claims verified by auth middleware.
- **Email uniqueness**: Not enforced globally; two users in different tenants may share an email — acceptable for this exercise but often constrained per-tenant with `UNIQUE (tenant_id, email)` in a later migration.

## Related files

- `AUDIT.md` — pre-refactor problems (contract).  
- `schema.sql` — tenants, `tenant_id`, composite FKs, indexes, seed.  
- `lib/responsePolicy.js` — field allow/deny by role.  
- `middleware/requireActor.js` — tenant + actor binding.
