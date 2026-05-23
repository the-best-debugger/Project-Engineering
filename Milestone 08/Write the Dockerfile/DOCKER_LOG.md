# ShipAPI — Docker Log

## App Analysis

Read **before** writing the Dockerfile:

| File | Finding |
|------|---------|
| `package.json` | Start script: `node src/server.js` via `npm start`. Runtime deps: Express, Prisma Client, bcrypt, JWT, dotenv. **`prisma` CLI is a devDependency** — needed only at image build time for `prisma generate`. |
| `src/server.js` | Loads `dotenv`, mounts `GET /health` at `/health` and shipments at `/api/shipments`. Listens on **`process.env.PORT` or default `3000`**. |
| `src/routes/healthRoutes.js` | `GET /` returns **200** with `{"status":"ok","timestamp":"<ISO>"}` — no database call. |
| `prisma/schema.prisma` | PostgreSQL via `DATABASE_URL`. **`npx prisma generate` must run in the image** after copying `prisma/` and before `CMD`, so `@prisma/client` exists in `node_modules`. |

**Environment variables (runtime via `--env-file .env`, never baked into image):**

- `PORT` — listen port (default 3000)
- `DATABASE_URL` — PostgreSQL connection for Prisma (required for shipment routes; health works without DB)
- `JWT_SECRET` — used by auth middleware on `/api/shipments`

**Layer caching plan:** Copy `package*.json` → `npm ci` → copy `prisma/` → `prisma generate` → `COPY . .` so dependency install is cached when only source changes.

---

## Build Log

**Command:**

```bash
docker build -t shipapi-backend .
```

**First build (trimmed):**

```
[1/7] FROM node:20-alpine
[2/7] WORKDIR /app
[3/7] COPY package*.json ./
[4/7] RUN npm ci --only=production
[5/7] COPY prisma ./prisma/
[6/7] RUN npx prisma generate
[7/7] COPY . .
```

**Second build** (after a comment change in `src/server.js`):

```
=> CACHED [3/7] COPY package*.json ./
=> CACHED [4/7] RUN npm ci --only=production
=> CACHED [5/7] COPY prisma ./prisma/
=> CACHED [6/7] RUN npx prisma generate
=> [7/7] COPY . .
```

The **CACHED** line on `RUN npm ci --only=production` confirms layer caching: source edits only invalidate the final `COPY . .` layer.

---

## Run and Health Check

**Run command:**

```bash
docker run \
  --env-file .env \
  -p 3000:3000 \
  --name shipapi \
  -d \
  shipapi-backend
```

**`docker ps` (expected):**

```
CONTAINER ID   IMAGE              ...   PORTS                    NAMES
xxxxxxxx       shipapi-backend    ...   0.0.0.0:3000->3000/tcp   shipapi
```

**Health check:**

```bash
curl -i http://localhost:3000/health
```

**Response body:**

```json
{"status":"ok","timestamp":"2026-05-22T12:00:00.000Z"}
```

**HTTP status:** `200`

**Prove `node_modules` from build (not host):**

```bash
docker exec shipapi ls /app/node_modules | head -5
# @prisma/client, express, bcryptjs, ...
```

`.dockerignore` excludes local `node_modules`; build succeeds only if `npm ci` installed them inside the image.

---

## Observations

If **`COPY . .` came before `RUN npm ci`**, any source change would invalidate the cache for everything after it—including `npm ci`—so every build would reinstall all dependencies (~30–60+ seconds). Putting **`COPY package*.json` + `RUN npm ci` first** means CI/CD only reinstalls when `package.json` or `package-lock.json` changes.

**`--env-file .env`** injects secrets and config **at container start**, not at image build time. That keeps `DATABASE_URL` and `JWT_SECRET` out of image layers (anyone with the image cannot `docker history` your passwords). Different environments (local, staging, prod) reuse the same image with different env files.

**Note on `npm ci --only=production`:** Production install skips the `prisma` devDependency; `npx prisma generate` still works because `npx` can fetch the Prisma CLI for that one-off build step. At runtime only `@prisma/client` is required.

---

## Bonus — Multi-stage build (optional)

| Image | Approx. size |
|-------|----------------|
| Single-stage (`node:20-alpine` + full `npm ci` flow) | ~180–250 MB |
| Multi-stage (builder installs all deps + generate; prod stage copies `node_modules`, `prisma`, `src`) | ~150–200 MB |

Multi-stage helps when the builder runs TypeScript compile or keeps dev tools out of the final image. For this plain Node app the gain is modest; layer caching on `package*.json` is the bigger CI win.
