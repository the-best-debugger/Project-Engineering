# Auth Fire Drill — Security Investigation & Fixes

## How the Six Vulnerabilities Connect

Authentication and authorisation failed as a chain: a **hardcoded, non-expiring JWT** could be forged or reused indefinitely; the token carried **no role**, so `roleCheck` always saw `undefined` and blocked nothing meaningful while endpoints had **no checks anyway**; the frontend stored **role in localStorage**, so UI permissions were cosmetic; **open CORS** allowed cross-site state-changing requests; and **logout** only cleared the browser, leaving stolen tokens valid on the server.

---

## Investigation (Before Fixes)

| # | Issue | What we observed |
|---|--------|------------------|
| 1 | Hardcoded JWT secret, no expiry | `SECRET = 'fragments-secret-key'` in source; tokens never expire |
| 2 | Role missing from JWT | `signToken({ userId })` only — `req.user.role` always `undefined` |
| 3 | Role in localStorage | DevTools: change `role` to `admin` → Approve/Delete buttons appear |
| 4 | Missing endpoint role checks | Reader can POST/PUT/approve/delete via curl; any user edits any fragment |
| 5 | CSRF / open CORS | `cors({ origin: '*' })`; no CSRF token on POST/PUT/DELETE |
| 6 | Logout client-only | Token copied before logout still works on API |

**Test accounts:** `reader@example.com`, `contributor@example.com`, `curator@example.com`, `admin@example.com` / `password123`

---

## Vulnerability 1: Hardcoded JWT Secret & No Expiry

- **Found in:** `server/auth/jwt.js`
- **Problem:** Secret in source code; `jwt.sign` without `expiresIn` — tokens valid forever; anyone with repo access can forge tokens.
- **Fix:** `JWT_SECRET` from environment; server exits if missing; `expiresIn: '1h'` on sign.

---

## Vulnerability 2: Role Missing from JWT Payload

- **Found in:** `server/routes/auth.js`, `server/middleware/auth.js`
- **Problem:** Payload only `{ userId }` — backend cannot enforce RBAC from token.
- **Fix:** Sign `{ userId, email, role }`; `req.user` carries role after verify.

---

## Vulnerability 3: Frontend Stores Role in localStorage

- **Found in:** `client/src/context/AuthContext.jsx`, `FragmentCard.jsx`, `AddFragmentForm.jsx`
- **Problem:** `localStorage.setItem('role', ...)` — trivial privilege escalation in DevTools.
- **Fix:** Remove role from localStorage; decode role from JWT payload only (`decodeToken`).

---

## Vulnerability 4: Missing Role Checks on Critical Endpoints

- **Found in:** `server/routes/fragments.js`
- **Problem:** Any authenticated user could create, edit any fragment, approve, delete.
- **Fix:**

| Endpoint | Allowed roles | Extra |
|----------|---------------|-------|
| `POST /` | contributor, curator, admin | Contributor → `pending` status |
| `PUT /:id` | contributor, curator, admin | Contributor → own fragments only |
| `POST /:id/approve` | curator, admin | — |
| `DELETE /:id` | admin | — |

Applied `roleCheck` middleware + ownership check on PUT.

---

## Vulnerability 5: CSRF Vulnerability

- **Found in:** `server/index.js`
- **Problem:** `origin: '*'` — malicious sites can trigger authenticated requests from victim browser.
- **Fix:** CORS restricted to `CLIENT_ORIGIN`; double-submit CSRF via `csrfToken` cookie + `X-CSRF-Token` header; `csrfProtect` on all state-changing fragment routes and enforced on auth logout.

---

## Vulnerability 6: Logout Does Not Invalidate Token

- **Found in:** `client/src/components/LogoutButton.jsx`, `server/middleware/auth.js`
- **Problem:** Logout cleared localStorage only; stolen token still authorized.
- **Fix:** In-memory `blacklist`; `POST /api/auth/logout` adds token to blacklist; `auth` middleware rejects blacklisted tokens.

---

## Code Changes Summary

### Backend

- `server/auth/jwt.js` — env secret, 1h expiry
- `server/index.js` — dotenv, secret validation, CORS lockdown, cookie-parser
- `server/routes/auth.js` — role in JWT, CSRF cookie, logout endpoint
- `server/middleware/auth.js` — blacklist check, Bearer format, expiry handling
- `server/middleware/csrf.js` — new CSRF middleware
- `server/routes/fragments.js` — roleCheck + csrfProtect + ownership

### Frontend

- `client/src/context/AuthContext.jsx` — JWT-derived role only
- `client/src/api/client.js` — CSRF header, credentials, 401 handler
- `client/src/components/LogoutButton.jsx` — server logout call

---

## Verification

| Test | Expected after fix |
|------|-------------------|
| Change `role` in localStorage | No effect — role read from JWT |
| Reader POST `/api/fragments` | **403** |
| Contributor edit another's fragment | **403** |
| Reader approve/delete | **403** |
| POST without `X-CSRF-Token` | **403** CSRF error |
| Use token after logout | **401** Token revoked |
| Token older than 1 hour | **401** Session expired |

---

## Run Locally

```bash
cd server && cp .env.example .env && npm install && npm start
cd client && npm install && npm run dev
```
