# Screenshots — Deployment Checklist Evidence

Capture each file while working through the checklist. Use these exact filenames:

| File | Checklist item |
|------|----------------|
| `01-env-vars-platform.png` | Render/Railway env keys (values redacted OK) |
| `02-local-build.png` | Terminal: `cd frontend && npm run build` success |
| `03-ci-build.png` | GitHub Actions green run for your commit |
| `04-migration-log.png` | Deploy log: `prisma migrate deploy` output |
| `05-cors-network-tab.png` | Browser Network: API calls 200, no CORS errors |
| `06-api-url.png` | `VITE_API_BASE_URL` in platform OR Request URL on production domain |
| `07-auth-production.png` | Logged-in UI with production URL in address bar |
| `08-health-curl.png` | Terminal: `curl` to `/health` returns 200 JSON |
| `09-no-secrets-git.png` | `git log` commands showing no `.env` in history |
| `10-env-example.png` | `.env.example` in repo (optional if pasted in checklist) |
| `11-node-version.png` | `engines` in package.json + platform Node version |
| `12-docker-build.png` | Only if using Docker (Item 12 SKIP otherwise) |

Do not commit secrets. Redact values in platform screenshots.
