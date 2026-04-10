# CorpFlow Workforce Management API (multi-tenant)

CorpFlow API with **tenant isolation** (`tenant_id`), **composite foreign keys** so relationships cannot cross tenants, **role-aware JSON** (no `password_hash`; salary and billing restricted), and **indexed** tenant queries.

## Docs

- `AUDIT.md` — pre-refactor audit (specific problems).  
- `SECURITY.md` — sensitive fields, RBAC, tenant queries, risks.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Database

```bash
createdb corpflow
npm run seed
```

Configure `DATABASE_URL` in `.env` (see `.env.example`).

## Run

```bash
cd "Milestone-03/SaaS Isolation & Role-Aware Data Access"   # or your path to this folder
npm install
cp .env.example .env   # then edit DATABASE_URL if needed
npm start
```

**Important:** Run `npm start` from **this project directory** (where `package.json` and `.env` live). If you start Node from the repo root, `dotenv` may not load `DATABASE_URL`, and `/users` will return `Failed to resolve request context.` (the DB query in middleware throws).

### Troubleshooting `Failed to resolve request context.`

1. **`DATABASE_URL` missing** — Create `.env` next to `package.json` with a valid `postgresql://...` URL.  
2. **PostgreSQL not running** — Start the service; errors often show `ECONNREFUSED`.  
3. **Schema not applied** — Run `npm run seed` or `psql -f schema.sql` against the same database as `DATABASE_URL`.  
4. In **development**, the JSON body now includes `details` (the underlying error message) to make this obvious.

## Auth context (required for `/users` and `/projects`)

Send headers on every data request:

| Header | Example | Meaning |
|--------|---------|---------|
| `X-Tenant-Id` | `1` | Organisation (tenant) id |
| `X-User-Id` | `1` | Acting user id (must belong to that tenant) |

### Example (curl)

Admin (Alice, tenant Pouch):

```bash
curl -s -H "X-Tenant-Id: 1" -H "X-User-Id: 1" http://localhost:3000/users
```

Employee (David, Velocity) — only assigned projects, no budget:

```bash
curl -s -H "X-Tenant-Id: 2" -H "X-User-Id: 4" http://localhost:3000/projects
```

Billing (admin only):

```bash
curl -s -H "X-Tenant-Id: 1" -H "X-User-Id: 1" http://localhost:3000/users/1/billing
```

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| GET | `/` | Health / info (no headers) |
| GET | `/users` | Tenant-scoped; shape depends on role |
| GET | `/users/:id` | Tenant-scoped; employee = self only |
| GET | `/users/:id/billing` | **Admin only** |
| GET | `/projects` | Tenant-scoped; employee = assigned only |
| GET | `/projects/:id` | Same rules |

## Live deployment

_Add your Render/Railway URL after deploy._

## Seed summary

- **Tenant 1** — Pouch: users Alice (admin), Bob (manager); project Pouch Portal.  
- **Tenant 2** — Velocity: users Charlie (admin), David (employee); projects Velocity Engine, Secret R&D; David assigned to Velocity Engine only.
