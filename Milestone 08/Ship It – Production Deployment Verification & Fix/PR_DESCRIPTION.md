# PR: fix/deployment-verification

## Summary

- Bug type: Type B — CORS issue (backend)
- Location: `backend/src/server.js`
- Before: CORS origin hard-coded to `http://localhost:5173`
- After: CORS origins are configurable via `FRONTEND_URL` (comma-separated list)

## Changes

- Modified `backend/src/server.js` to read `FRONTEND_URL` environment variable and allow a comma-separated list of origins.

## How to verify

1. Set environment variables on Render for the backend:
   - `FRONTEND_URL=https://your-app.vercel.app`
2. Deploy backend on Render and confirm health check:
   - `curl https://your-backend.onrender.com/health` → `{ "status": "ok" }`
3. Set frontend environment variable on Vercel/Netlify:
   - `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy frontend and open the app: `https://your-app.vercel.app`
5. Open DevTools → Network, reload. Confirm `/api/items` request goes to `https://your-backend.onrender.com/api/items` and returns 200.
6. Confirm GitHub Actions run green for the PR branch.

## Reflection (for the PR body)

1. What was the bug and where was it located?

The backend allowed requests only from `http://localhost:5173` (see `backend/src/server.js`). This blocked requests from the deployed frontend domain and caused CORS errors.

2. How did you identify it?

I inspected the backend server configuration and found the hard-coded CORS origin. The frontend code used `VITE_API_URL` so when deployed the frontend attempted cross-origin requests to the backend and was blocked by CORS.

3. How will you prevent this in future?

- Use environment variables for deployment-specific origins, and require them in deployment docs.
- Add a deployment checklist step to verify `FRONTEND_URL`/`VITE_API_URL` are set in hosting dashboards.
- Add a CI step that runs a basic integration test against a staging URL when available.

## Notes

- I updated `DEPLOY_CHECKLIST.md` with the bug details and instructions for filling proofs after deployment.

Please create the branch `fix/deployment-verification`, commit the changes, push, and open the PR using this body. If you prefer, I can provide the exact git commands to run locally.
