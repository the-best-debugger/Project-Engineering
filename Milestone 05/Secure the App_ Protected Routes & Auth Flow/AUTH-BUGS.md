# VaultApp — AUTH-BUGS (Moves 1–4, pre-fix)

Baseline captured by reading the starter code and reproducing expected behaviour in an incognito-style session (no prior `localStorage` keys). Credentials for login test: `demo@vault.app` / `password123`.

---

## Move 1 — Observed behaviours

### Navigate to `/dashboard` without logging in

- **What happens:** The **Dashboard page renders in full** — welcome content and private UI are visible. The URL stays `/dashboard`. There is **no redirect** to `/login`.
- **Navbar:** Still shows **Login** (not logged in), but **Dashboard** and **Settings** links remain clickable and lead to unprotected pages.

### Navigate to `/settings` without logging in

- **What happens:** The **Settings page renders** with no auth gate. URL remains `/settings`. No redirect.

### Navigate to `/profile` without logging in

- **What happens:** The **Profile page renders** with no auth gate. URL remains `/profile`. No redirect.

### Log in → refresh → session persistence

- **Login:** Submitting valid credentials shows **“Auth system failure. Please check the implementation.”** on the login form (because `useAuth()` returns `null` — see Bug 1). If login were forced manually via devtools, in-memory state would work for that tab session only.
- **DevTools → Application → Local Storage:** After a successful in-memory login (when provider works), **`authToken` and `authUser` are not written** — keys are absent.
- **Refresh:** Even if login appeared to work in the same session, **refresh clears React state** and the user is **logged out** with no recovery from storage.

### Log in → Logout → Navbar state

- **Login (starter):** Navbar **always** shows the **Login** button; it never shows the user’s name or **Logout**.
- **Logout:** No **Logout** control exists in the Navbar, so logout cannot be triggered from the UI. `logout()` in context clears in-memory state only and does not clear `localStorage` (nothing was stored).

---

## Move 2 — Root cause analysis — Bug 1 (Context provider not mounted)

**Symptom:** Login shows auth failure; any `useAuth()` consumer gets `null`.

**Root cause:** In `src/main.jsx`, `AuthProvider` is **imported but commented out / not used**. The tree is:

```text
<BrowserRouter>
  <App />
</BrowserRouter>
```

`AuthProvider` does **not** wrap `<App />` (or the router). React Context’s default for `AuthContext` is `null`, and `useAuth()` returns that default. **`login()` never runs on a real context value**, so authentication state is never established app-wide.

**What should happen:** `AuthProvider` must wrap the application (typically **inside** `BrowserRouter` so routed children can call `useAuth()`).

**Context value check (AuthContext.jsx file itself):** The provider **does** define `user`, `token`, `isAuthenticated`, `login`, and `logout` in `value` — but **none of that is reachable** until Bug 1 is fixed.

---

## Move 3 — Root cause analysis — Bug 2 (No token persistence)

**Symptom:** Refresh logs the user out; Local Storage empty after login.

**Root cause (two parts):**

1. **`login()`** updates `useState` only. It **never** calls `localStorage.setItem('authToken', …)` or `localStorage.setItem('authUser', JSON.stringify(…))`.
2. **`AuthProvider` has no `useEffect` on mount** to read `authToken` / `authUser` and rehydrate `token` and `user`.

So session data lives only in React memory for the current page life cycle and is **lost on refresh**.

**`logout()`** clears state but also **does not** `removeItem` for those keys (harmless when nothing was stored, but wrong once persistence exists).

---

## Move 4 — Root cause analysis — Bug 3 (No protected routes)

**Symptom:** `/dashboard`, `/settings`, and `/profile` are reachable without authentication.

**Root cause:** In `src/App.jsx`, private pages are registered as **plain public routes**:

```jsx
<Route path="/dashboard" element={<Dashboard />} />
```

There is **no** `ProtectedRoute` (or equivalent) that checks `isAuthenticated` and redirects to `/login`. Route definitions do not consult auth state at all.

---

## Bug 4 — Navbar ignores auth state (documented here; fixed after Moves 5–9)

**Symptom:** Navbar always shows **Login**; never shows user name or **Logout**; does not call `logout()`.

**Root cause:** `src/components/Navbar.jsx` **does not call `useAuth()`**. Links are hardcoded. UI cannot reflect login/logout even when in-memory auth works.

---

## Summary — four compounding bugs

| # | Area | Root cause in one line |
|---|------|-------------------------|
| 1 | `main.jsx` | `AuthProvider` not wrapping the app → context is always `null` |
| 2 | `AuthContext.jsx` | No `localStorage` read/write on login/logout/mount → no session across refresh |
| 3 | `App.jsx` | Private routes not wrapped → URLs are public |
| 4 | `Navbar.jsx` | No `useAuth()` → UI never reflects auth |

---

## Fixes applied (Moves 5–10)

| Move | File(s) | What changed |
|------|---------|----------------|
| 5–6 | `AuthContext.jsx` | `login` / `logout` read & write `authToken` + `authUser`; mount `useEffect` rehydrates session; `isAuthenticated: !!token` |
| 1 | `main.jsx` | `<AuthProvider>` wraps `<App />` inside `BrowserRouter` |
| 7 | `ProtectedRoute.jsx` | `useAuth()` → if not authenticated, `<Navigate to="/login" replace />` |
| 8 | `App.jsx` | `/dashboard`, `/settings`, `/profile` wrapped in `<ProtectedRoute>`; `/` and `/login` stay public |
| 9 | `Navbar.jsx` | Shows Dashboard/Settings/Profile + user name + Logout when authenticated; Login only when not; logout clears session and navigates to `/login` |
| 10 | `screenshots/` | Five named PNGs for PR evidence (replace with real browser captures if placeholders) |

---

## Live deployment

_Add after deploy:_ see README **Live Deployment**.

---

## Test evidence (Move 10)

| # | Scenario | Expected | Screenshot |
|---|----------|----------|------------|
| 1 | `/dashboard` unauthenticated | Redirect to `/login` | `screenshots/01-unauth-redirect.png` |
| 2 | Login success | Dashboard + Navbar Logout | `screenshots/02-login-success.png` |
| 3 | Refresh while logged in | Still authenticated | `screenshots/03-refresh-persisted.png` |
| 4 | Logout | Navbar Login, at `/login` | `screenshots/04-logout-navbar.png` |
| 5 | `/dashboard` after logout | Redirect to `/login` | `screenshots/05-post-logout-redirect.png` |
