# DEPLOYMENT_LOG.md

> LinkShelf — CORS, build env, and Prisma client fixes (LU 8.6)

---

## 1. What Failed?

### Browser Console (before fixes)

```
Access to fetch at 'https://linkshelf-api.onrender.com/api/auth/login'
from origin 'https://linkshelf-frontend.onrender.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

```
GET https://undefined/api/auth/login net::ERR_NAME_NOT_RESOLVED
```

```
TypeError: Failed to fetch
```

### Browser Network tab (before fixes)

| Request | Status | Notes |
|---------|--------|-------|
| `OPTIONS /api/auth/login` | (failed) | Preflight blocked — no matching `Access-Control-Allow-Origin` |
| `POST undefined/api/auth/login` | (failed) | `VITE_API_URL` was not set at build time → URL is literally `undefined/api/...` |
| `GET /api/health` (direct to API) | 200 | Health check works in browser address bar — **not** a CORS request |

### Frontend UI (before fixes)

- Debug banner: **API URL: ⚠️ undefined (VITE_API_URL not set!)**
- Login/signup buttons fail immediately with red error box

### Render backend logs (before fixes — first DB call)

```
PrismaClientInitializationError: @prisma/client did not initialize yet.
Please run "prisma generate" and try to import it again.
```

---

## 2. Root Cause Analysis

| # | Issue Found | File(s) Affected | Why It Caused a Failure |
|---|-------------|------------------|-------------------------|
| 1 | CORS `origin: "*"` with credentialed requests | `src/index.js` | Browsers refuse `Access-Control-Allow-Origin: *` when `credentials: true` or `Authorization` triggers a credentialed preflight. Preflight fails → no API response reaches the app. |
| 2 | `VITE_API_URL` missing at build time | `render.yaml` (frontend service) | Vite replaces `import.meta.env.VITE_API_URL` during `npm run build`. Without it, the bundle contains `undefined` → requests go to `undefined/api/...`. |
| 3 | `npx prisma generate` missing from build | `render.yaml` (backend service) | `npm install` does not generate the Prisma Client. Server starts; health route works; first Prisma query crashes. |
| 4 | `CORS_ORIGIN` not set in production | `render.yaml` (backend service) | Backend cannot echo the frontend origin in CORS headers even after code fix. |

---

## 3. Fixes Applied

### Fix 1 — CORS configuration

**File:** `src/index.js`

- Replaced `origin: "*"` with `origin: process.env.CORS_ORIGIN`
- Set `credentials: true` (required for credentialed cross-origin requests)
- Added `CORS_ORIGIN` to `validateEnv()` required list
- Added `OPTIONS` to allowed methods for preflight

**File:** `frontend/src/config.js`

- Added `credentials: "include"` on `fetch()` to match backend CORS policy

### Fix 2 — Frontend build environment

**File:** `render.yaml` (frontend service)

```yaml
- key: VITE_API_URL
  fromService:
    type: web
    name: linkshelf-api
    envVarKey: RENDER_EXTERNAL_URL
```

`RENDER_EXTERNAL_URL` resolves to `https://linkshelf-api.onrender.com` at build time. App routes use `/api/auth/...`, so the final URL is `https://linkshelf-api.onrender.com/api/auth/login`.

**File:** `frontend/.env.example` — local dev: `VITE_API_URL=http://localhost:3000`

### Fix 3 — Build command + database blueprint

**File:** `render.yaml` (backend service)

```yaml
buildCommand: npm install && npx prisma generate && npx prisma migrate deploy
```

Added `databases` block for `linkshelf-db` (was referenced but not defined).

**Backend CORS origin from frontend deploy URL:**

```yaml
- key: CORS_ORIGIN
  fromService:
    type: web
    name: linkshelf-frontend
    envVarKey: RENDER_EXTERNAL_URL
```

---

## 4. Verification

### After fixes — expected behavior

| Check | Expected |
|-------|----------|
| Frontend debug banner | `API URL: https://linkshelf-api.onrender.com` |
| Preflight `OPTIONS` | **200** with `Access-Control-Allow-Origin: https://linkshelf-frontend.onrender.com` |
| `POST /api/auth/login` | **200** with `{ token, user }` |
| Create bookmark | **201** — proves Prisma client generated |
| Render build log | `npx prisma generate` completes without error |

### Screenshots to attach (your submission)

- [ ] Network tab: successful OPTIONS preflight (200)
- [ ] Network tab: successful POST login (200)
- [ ] Console: no CORS errors
- [ ] Render dashboard: green deploy for both services

---

## 5. Key Takeaways

**CORS:** The browser enforces same-origin policy for `fetch` from a different domain. A wildcard `*` cannot be used when credentials or `Authorization` headers are involved — the server must return exactly one allowed origin.

**Build-time vs runtime:** React/Vite frontends are static files after build. `VITE_*` variables must exist when `npm run build` runs on Render. Node backends read `process.env` at runtime on each request/start.

**Prisma:** `npm install` installs the package; `npx prisma generate` creates the client code your imports depend on — it must be part of the production build step.
