# VaultApp — Protected routes & auth flow

React training app for fixing broken authentication: context provider, `localStorage` persistence, protected routes, and navbar state.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Demo login:** `demo@vault.app` / `password123`

## Live deployment

_Add your production URL after deploying (Vercel / Netlify):_

**Live app:** `https://YOUR-DEPLOYMENT.example`

## Documentation

- [AUTH-BUGS.md](./AUTH-BUGS.md) — observed behaviours, root causes (Moves 1–4), fixes, test matrix

## Test flows (Move 10)

1. Visit `/dashboard` logged out → redirect to `/login`
2. Log in → dashboard + Navbar shows name + Logout
3. Refresh → still logged in (`authToken` / `authUser` in Local Storage)
4. Logout → Navbar shows Login, on `/login`
5. Visit `/dashboard` again → redirect to `/login`

Screenshots: [`screenshots/`](./screenshots/)
