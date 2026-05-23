# DEPLOYMENT_LOG.md

> NoteVault — secrets and environment variables (LU 8.5)

---

## 1. What Failed?

On Render, the service could start but the first database or auth request failed because:

- `src/config/db.js` pointed Prisma at a **hardcoded** `localhost:5432` URL.
- `src/middleware/auth.js` used a **hardcoded** JWT secret visible in GitHub.
- `render.yaml` did not inject `DATABASE_URL` or `JWT_SECRET`.
- No startup check — missing vars surfaced only at runtime.

```
# Typical production symptom (database)
Can't reach database server at `localhost:5432`
```

---

## 2. Root Cause Analysis

| # | Issue Found | File(s) Affected | Why It Caused a Failure |
|---|-------------|------------------|-------------------------|
| 1 | Hardcoded `DATABASE_URL` in Prisma client | `src/config/db.js` | Render has no local Postgres; connection fails |
| 2 | Hardcoded `JWT_SECRET` | `src/middleware/auth.js`, `src/routes/auth.js` | Secret in repo; prod cannot rotate; security risk |
| 3 | No env template | (missing `.env.example`) | Developers/deploys lack required var list |
| 4 | No fail-fast validation | `src/index.js` | App boots with missing secrets; errors are opaque |
| 5 | Missing Render env config | `render.yaml` | Deploy runs without `DATABASE_URL` / `JWT_SECRET` |

---

## 3. Fixes Applied

### Fix 1 — `.env` + `.gitignore`

- Created `.env` at project root with `DATABASE_URL` and `JWT_SECRET` (local only).
- Added `.env` to `.gitignore` so secrets never enter version control.

### Fix 2 — Refactor to `process.env`

- **`src/config/db.js`**: Removed hardcoded datasource URL; `new PrismaClient()` reads `DATABASE_URL` from `prisma/schema.prisma`.
- **`src/middleware/auth.js`**: `jwt.verify(..., process.env.JWT_SECRET)`; removed exported secret constant.
- **`src/routes/auth.js`**: `jwt.sign(..., process.env.JWT_SECRET)`; removed import from middleware.

### Fix 3 — `.env.example`

- Committed template with placeholder keys for `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`.

### Fix 4 — `validateEnv()`

- **`src/config/validateEnv.js`**: Checks `DATABASE_URL` and `JWT_SECRET`; logs clear error and `process.exit(1)` if missing.
- **`src/index.js`**: Calls `validateEnv()` immediately after `dotenv.config()`, before `app.listen`.

### Fix 5 — `render.yaml`

- Added `notevault-db` PostgreSQL database.
- Wired `DATABASE_URL` via `fromDatabase.connectionString`.
- Set `JWT_SECRET` with `generateValue: true` for secure auto-generation on Render.

---

## 4. Redeploy Proof

- **Render Dashboard Screenshot**: _(attach after deploy)_
- **Health Check Response**:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

- **Render Logs (successful startup)**:

```
✅ All required environment variables are set.
🚀 NoteVault API running on port 10000
```

---

## 5. Key Takeaways

Secrets belong in the environment, not source code. Validating required variables at boot fails fast with a clear message instead of mysterious errors on the first API call. Infrastructure-as-code (`render.yaml`) should declare every secret the runtime needs, with generated values for sensitive keys like `JWT_SECRET`.
