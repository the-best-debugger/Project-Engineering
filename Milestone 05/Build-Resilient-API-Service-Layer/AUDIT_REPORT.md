# DevMarket API layer — audit report

## Scope

Audited all page components under `src/pages/` plus `src/components/Navbar.jsx` (no API usage). Counts below are for **production source files** only (`src/**/*.jsx`), excluding documentation.

## Summary counts

| Metric | Count |
|--------|------:|
| **`fetch(` calls** | **12** (some run repeatedly at runtime, e.g. one fetch per cart line item) |
| **String literals containing `https://fakestoreapi.com`** | **11** (includes 1 unused `BASE_URL` constant in `ProductsPage.jsx`) |
| **`localStorage.getItem('auth_token')` usages** | **5** |

## Per-file breakdown

### `ProductsPage.jsx`

| Metric | Count |
|--------|------:|
| `fetch(` | 3 |
| Hardcoded `https://fakestoreapi.com` | 4 (3 in `fetch` + unused `BASE_URL`) |
| `localStorage.getItem('auth_token')` | 1 |

**Endpoints:** `GET /products`, `GET /products/categories`, `POST /carts`.

**Patterns:** Two `useEffect` hooks both use `.then()` chains; categories fetch does **not** check `res.ok` (errors surface only in `catch` if JSON/network fails). Add-to-cart uses manual `Authorization` header.

---

### `ProductDetailPage.jsx`

| Metric | Count |
|--------|------:|
| `fetch(` | 4 call sites (2 in one `useEffect` chain: product then category) |
| Hardcoded `https://fakestoreapi.com` | 4 |
| `localStorage.getItem('auth_token')` | 2 |

**Endpoints:** `GET /products/:id`, `GET /products/category/:category`, `POST /carts`, `POST /users` (review placeholder).

**Nested `.then()` / mixed async:** The detail `useEffect` chains a second `fetch` inside the first `.then()`. That makes error attribution harder (a failure on “related” is caught by the same `catch` as “product not found”) and encourages copy-paste instead of a single composable data loader.

---

### `CartPage.jsx`

| Metric | Count |
|--------|------:|
| `fetch(` | 3 call sites (`1 + N` fetches on load: one cart + one product fetch per line item) |
| Hardcoded `https://fakestoreapi.com` | 3 |
| `localStorage.getItem('auth_token')` | 1 |

**Endpoints:** `GET /carts/user/1`, `GET /products/:productId` (×N), `DELETE /carts/:id`.

**Error handling:** Initial cart load uses `.catch(() => setError('Could not load your cart'))` — no status-specific handling. **401 is not handled** on load. Remove uses `alert()` on failure.

---

### `ProfilePage.jsx`

| Metric | Count |
|--------|------:|
| `fetch(` | 2 |
| Hardcoded `https://fakestoreapi.com` | 2 |
| `localStorage.getItem('auth_token')` | 1 |

**Endpoints:** `GET /users/1`, `PUT /users/1`.

**401 handling:** Load uses `err.message.includes('401')` (fragile — depends on error string). Save uses explicit `res.status === 401`. **Inconsistent with `CartPage`** (which ignores 401 on read paths).

---

## Inconsistent error handling (summary)

| Location | Behavior on errors |
|----------|-------------------|
| `ProductsPage` (products) | `setError(err.message)` |
| `ProductsPage` (categories) | `console.error` only — **silent for UI** |
| `ProductsPage` (add to cart) | `console.error` + toast-style message |
| `ProductDetailPage` (load) | `setError(err.message)` |
| `ProductDetailPage` (cart / review) | **`alert()`** |
| `CartPage` (load) | Generic `setError` |
| `CartPage` (remove) | **`alert()`** |
| `ProfilePage` (load) | `setError` with string-matching for “401” |
| `ProfilePage` (save) | Branch on `res.status === 401` vs thrown `Error` |

There is **no shared** policy for 401/403/5xx, logging, or user messaging.

## Why this breaks maintainability

1. **No single source of truth for the API origin** — Renaming the host, switching environments, or adding a path prefix requires editing many files; easy to miss one and ship a broken build.
2. **Auth header duplication** — Token attachment is copy-pasted; a change to header format or storage key requires a repo-wide hunt.
3. **Inconsistent transport and error semantics** — Mix of `.then()` / `async`/`await`, optional `res.ok` checks, and `alert` vs state means every new endpoint reinvents patterns and tests cannot target one module.
4. **Nested fetches** — Related data loading is harder to read, retry, or cancel; failures are harder to map to the step that failed.

## Network observation (expected)

- **Products (`/`):** Two parallel requests on mount (products + categories); POST when adding to cart.
- **Product detail (`/products/:id`):** Sequential requests (product, then category listing).
- **Cart (`/cart`):** One cart request, then one product request per cart line.
- **Profile (`/profile`):** One GET on mount; PUT on save.

## Live deployment URL

_Add after deploy (e.g. Vercel). Set `VITE_API_BASE_URL=https://fakestoreapi.com` in project environment variables._

**Deployed app:** `https://YOUR-DEPLOYMENT.example`

## Post-refactor (codebase state)

- **`src/pages/*.jsx`:** `fetch(` **0**; no hardcoded FakeStore URLs; **`localStorage.getItem('auth_token')` 0** (token is read only in `src/services/api.js` via the request interceptor).
- **`src/services/api.js`:** Single axios instance with `baseURL` from `import.meta.env.VITE_API_BASE_URL` (fallback `https://fakestoreapi.com`), request interceptor for `Authorization`, response interceptor for **401 / 403 / 5xx** (`console.warn` + rejected promise so existing per-page UI can still react).

## Post-refactor verification checklist

- [ ] All pages load and match prior UI/behavior.
- [ ] Network requests target the same paths (via `VITE_API_BASE_URL`).
- [ ] Request headers include `Authorization: Bearer <token>` when `auth_token` is set in `localStorage`.
- [ ] Response interceptor logs or handles 401 / 403 / 5xx in one place (see `src/services/api.js`).
