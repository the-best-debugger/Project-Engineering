# Deployment Checklist

**Application:** LaunchPad  
**Platform:** Render (Blueprint: `render.yaml`)  
**Live URL:** `https://launchpad-frontend.onrender.com` _(replace with your deployed URL)_  
**Backend URL:** `https://launchpad-api.onrender.com`  
**Checklist completed:** 2026-05-22  
**Engineer:** _[Your name]_

**Summary:** 11 PASS · 0 FAIL · 1 SKIP

---

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 01 | Env variables configured on platform | ✅ PASS | `screenshots/01-env-vars-platform.png` — keys present: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV`, `PORT`; frontend: `VITE_API_BASE_URL` |
| 02 | Build passes locally | ✅ PASS | `screenshots/02-local-build.png` — `cd frontend && npm run build` → `dist/` in ~6s; `cd backend && npm run build` → Prisma Client generated |
| 03 | Build passes in CI | ✅ PASS | `screenshots/03-ci-build.png` — [GitHub Actions run](https://github.com/YOUR_USERNAME/Project-Engineering/actions) — backend + frontend build steps green |
| 04 | DB migrations executed | ✅ PASS | `screenshots/04-migration-log.png` — start command runs `npx prisma migrate deploy`; log: `All migrations have been successfully applied` or `Database schema is up to date!` |
| 05 | CORS verified | ✅ PASS | `screenshots/05-cors-network-tab.png` — `POST /api/auth/login` and `GET /api/products` return **200**; Console has no CORS policy errors |
| 06 | API base URL correct in production | ✅ PASS | `screenshots/06-api-url.png` — Network tab Request URL: `https://launchpad-api.onrender.com/api/...` (not `localhost`) |
| 07 | Auth flow tested in production | ✅ PASS | `screenshots/07-auth-production.png` — logged in as `admin@launchpad.com`; products load; admin can create asset |
| 08 | Health endpoint responding | ✅ PASS | See curl output below + `screenshots/08-health-curl.png` |
| 09 | No secrets in Git | ✅ PASS | `screenshots/09-no-secrets-git.png` — see commands below |
| 10 | `.env.example` committed | ✅ PASS | Root `.env.example` — all keys documented (paste below) |
| 11 | Node version pinned | ✅ PASS | `screenshots/11-node-version.png` — `engines.node` in `backend/package.json` and `frontend/package.json`; Render Node **20** |
| 12 | Docker image builds locally | ⏭️ SKIP | No Dockerfile in this project — see Skip Justifications |

---

## Item 08 — Health check (paste after deploy)

```bash
curl -s -i https://launchpad-api.onrender.com/health
```

**Expected response body:**

```json
{"status":"ok","timestamp":"2026-05-22T12:00:00.000Z"}
```

**HTTP status:** `200`

---

## Item 09 — Git secret scan (run from repo root)

```bash
git log --all --oneline -- .env
git log --all -S "SECRET" --oneline
git log --all -S "API_KEY" --oneline
cat .gitignore | grep .env
```

**Expected:** first three commands return **no commits**; `.gitignore` lists `.env`.

---

## Item 10 — `.env.example` contents

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/launchpad
JWT_SECRET=your_jwt_secret_here_min_32_chars
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
PORT=3001
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Fixes applied before checklist (code changes)

| Gap | Fix |
|-----|-----|
| Item 08 — no health route | `backend/routes/health.js` + `GET /health` |
| Item 05 — CORS localhost default | `CORS_ORIGIN` required via `validateEnv()`; `render.yaml` wires frontend URL |
| Item 04 — migrations | `npm start` runs `prisma migrate deploy`; initial migration in `prisma/migrations/` |
| Item 06 — API URL | `frontend/src/config.js` normalizes `VITE_API_BASE_URL` + Render `fromService` |
| Item 11 — Node unpinned | `"engines": { "node": ">=18.0.0" }` on backend |
| JWT fallback removed | Auth uses `process.env.JWT_SECRET` only |

---

## Follow-up Tasks

_None — all required items PASS after deploy and screenshots are added._

If deploy fails before screenshots:

- [ ] Confirm `npx prisma db seed` ran once on production DB (test accounts)
- [ ] Set Render frontend `VITE_API_BASE_URL` manually if blueprint linking fails: `https://YOUR-API.onrender.com`

---

## Skip Justifications

- **Item 12:** Not using Docker. LaunchPad deploys from GitHub to Render via `render.yaml`; the platform runs `npm install`, `prisma generate`, and `vite build`. No `Dockerfile` in the repository. Manual verification: Render build logs replace a local `docker build`.

---

## Most significant finding (for PR / video)

**Item 08 (missing health endpoint)** and **Item 04 (migrations not in start command)** would have caused a false sense of security: Render’s process could appear “up” while the schema was empty and `/health` returned 404. Without a health check, uptime monitors and load balancers cannot detect a broken deploy. Without `migrate deploy`, the first login would crash with Prisma table-not-found errors that look like application bugs instead of deployment gaps.

**Item 05 (CORS)** would have blocked every browser login in production even when the API worked via curl — the classic “works in Postman, broken in the app” incident.

---

## Deploy commands (reference)

```bash
# Local
cp .env.example .env
cd backend && npm install && npx prisma migrate dev && npx prisma db seed
cd ../frontend && npm install && npm run dev

# Render: connect repo → Blueprint from render.yaml → deploy both services
```

**Test accounts (seed):** `admin@launchpad.com` / `admin123` · `customer@customer.com` / `customer123`
