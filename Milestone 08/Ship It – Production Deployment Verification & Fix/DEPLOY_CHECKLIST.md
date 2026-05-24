# FullShip — Deployment Checklist

## Bug Found
Type: Type B — CORS issue (backend)
Location: backend/src/server.js
Before value: CORS origin was hard-coded to 'http://localhost:5173'
After value: CORS origins are configurable via `FRONTEND_URL` (comma-separated list)
Fix confirmed by: code change to `backend/src/server.js` (commit message: "fix: allow configurable CORS via FRONTEND_URL")

## Checklist
- [ ] Frontend is live — Proof: (fill after deploying frontend)
- [ ] Backend is live — Proof: (fill after deploying backend; example: `curl https://your-backend.onrender.com/health`)
- [ ] API call works end-to-end — Proof: (Network tab screenshot showing 200 OK)
- [ ] CI pipeline passes — Proof: (GitHub Actions screenshot)
- [ ] Health check responds — Proof: (200 OK JSON from `/health`)

## Reflection
1. What broke: The backend only allowed CORS from `http://localhost:5173`, blocking requests from deployed frontend domains.
2. How identified: I inspected `backend/src/server.js` and observed the hard-coded CORS origin; this matches the browser CORS error seen when frontend is deployed.
3. Prevention: Make allowed origins configurable via an environment variable (`FRONTEND_URL`) and include this check in code reviews and deployment playbooks. Use a CI check to ensure `FRONTEND_URL` is set for production deployments.
