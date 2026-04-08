# Challenge 1.11 — Refactoring log (Dev Confessions)

This file documents the pre-refactor audit (Move 1), required rename and split tables (Moves 2–3 / Section 1–2), and every other structural decision (Moves 4–7).

---

## Move 1 — Pre-refactor audit (before any code changes)

Problems identified in the original single-file app:

| Area | Problem |
|------|---------|
| **Naming** | Meaningless or vague identifiers: `d`, `r`, `t`, `x`, `tmp`, `arr`, `i`, `fn`, `stuff`, `handler`, `res2`, duplicate `i` in different branches, `cats` vs `categories` for the same idea. |
| **Structure** | Entire API in `app.js`; no separation of routing, orchestration, and domain rules. |
| **God function** | `handleAll(req, res, t)` branches on a string token for create, list, get-one, category list, and delete — five unrelated behaviors in one function (~90 lines). |
| **Coupling** | Routes call the god function with magic strings (`'create'`, `'getCat'`, etc.) instead of explicit handlers. |
| **Hardcoded configuration** | Port `3000`, startup log string tied to 3000, delete header token `supersecret123`, allowed categories duplicated in two arrays inside the handler. |
| **Env / secrets** | No `.env` or `.env.example`; configuration mixed with code. |
| **Comments** | None; non-obvious choices (e.g. in-place `sort` mutating the store, `filter().reverse()` vs sorting) were undocumented. |
| **Consistency** | Mixed `var` / `let` / `const` without a clear rule. |
| **Route order** | `GET /confessions/:id` was registered before `GET /confessions/category/:cat`, so `category` could be interpreted as an `:id` and the category endpoint could never run as documented (see Move 4 decision below). |
| **HTTP edge case** | `GET .../category/:cat` handler only called the core logic when `req.params.cat` was truthy; if not, no response was sent (left as-is in the controller for parity). |
| **Dead / noisy code** | `if (confessions.length > 500)` at module load always false on startup but preserved to avoid changing observable side effects if the file were ever extended. |

---

## Section 1 — Variable renames

| Old name | New name | Why |
|----------|----------|-----|
| `d` | `confessionData` (controller: `req.body`) | `d` did not indicate payload shape or role. |
| `r` | `routeParams` | Clarifies Express `req.params` versus body or locals. |
| `t` | _(removed)_ | Replaced by dedicated route handlers instead of a mode string. |
| `x` | `nextConfessionId` | Explains monotonic id generation. |
| `tmp` | `newConfession` | Describes the object being created and returned. |
| `arr` | `sortedConfessions` | It was the full list sorted by date, not a filtered subset. |
| `fn` (callback param) | `confession` | Standard name for each element in `find`. |
| `info` | `foundConfession` | Matches lookup outcome in `getOne`. |
| `cat` | `categoryParam` | Distinguishes route param from generic “category” concept. |
| `cats` | _(removed)_ | Replaced by `getAllowedCategories()` / `ALLOWED_CATEGORIES` env. |
| `categories` | _(removed)_ | Same list as `cats`; single source in config. |
| `stuff` | `filteredConfessions` | Describes filtered-by-category results before JSON send. |
| `handler` | `confessionIndex` | `findIndex` returns a numeric index, not an HTTP handler. |
| `res2` | `removedConfessions` (`splice` result) / `deletedConfession` (element) | `res2` looked like a response object but held deleted rows. |
| `startStr` | `startMessage` | Slightly clearer; value now includes the live port from config. |

---

## Section 2 — Function splits

### `handleAll()` replaced by explicit layers

**Service (`services/confessionService.js`) — single-responsibility pieces:**

| Function | Responsibility |
|----------|----------------|
| `getAllowedCategories()` | Resolves allowed category slugs from `ALLOWED_CATEGORIES` (comma-separated) with the same default list as before when unset. |
| `isAllowedCategory(category)` | Boolean guard for a single slug. |
| `validateConfessionInput(requestBody)` | Encodes all create-validation rules and returns reason codes so the controller can preserve exact status bodies from the original app. |
| `saveConfession({ text, category })` | One write: assign id, timestamps, push to store. |
| `formatConfessionResponse(confession)` | Stable shaping hook for create responses (currently identity, keeps create flow readable and easy to extend). |
| `getAllConfessionsNewestFirst()` | In-place sort like the original `sort` on the shared array. |
| `buildConfessionListEnvelope(sortedConfessions)` | Builds `{ data, count }` for list responses. |
| `getConfessionById(confessionId)` | Lookup by numeric id. |
| `getConfessionsByCategory(categorySlug)` | Filter + `reverse` to mirror the old `.filter(...).reverse()` behavior without mutating the main store order. |
| `removeConfessionById(confessionId)` | Find index, splice, return `{ removed, deletedConfession }`. |
| `getConfessionCount()` | Exposes store size for the legacy startup check. |

**Controller (`controllers/confessionsController.js`)** maps HTTP to those services: `createConfession`, `listConfessions`, `getConfessionById`, `getConfessionsByCategory`, `deleteConfession`.

**Why:** The old function mixed validation, persistence, querying, filtering, authorization, and response mapping. Splitting makes each rule testable and keeps routes free of business logic.

---

## Move 4 — MVC-style folders

- `routes/confessions.js` — mounts Express paths only; forwards to controller methods.
- `controllers/confessionsController.js` — reads `req` / `res`, calls services, sends status + body.
- `services/confessionService.js` — in-memory “database” and all business rules.

**Route order decision:** `GET /confessions/category/:cat` is registered **before** `GET /confessions/:id` so category URLs work as documented. This intentionally fixes the original registration bug rather than preserving a broken route match.

---

## Move 5 — Environment variables

| Concern | Variable | Notes |
|---------|----------|-------|
| Listen port | `PORT` | Loaded via `dotenv` in `app.js`; must be set (e.g. `3000` in `.env` from `.env.example`); startup throws if missing or invalid so there is no hidden default in code. |
| Allowed categories | `ALLOWED_CATEGORIES` | Comma-separated; when empty/unset, service falls back to the original four slugs. |
| Delete header secret | `DELETE_SECRET_TOKEN` | Value previously hardcoded; must be a non-empty string at process start (`app.js` throws if missing) so misuse cannot silently widen the attack surface. |

---

## Move 6 — Inline comments

Comments were added only on **non-obvious** blocks (why in-place sort is kept, why category routes are ordered first, why validation order mirrors the legacy `if` ladder, why filtered results use `slice().reverse()`). Obvious Express wiring is left uncommented.

---

## Move 8 — PR, deploy, submit (your steps)

1. Fork / branch from the starter repo, push this refactored tree.
2. Open a PR against the upstream starter; describe Moves 1–7 and link the deployment.
3. Deploy the branch (Render, Railway, Fly, etc.).
4. Put the **live URL** in the PR description and in `README.md` under **Live demo**.

---

## Dependency note

- Added **`dotenv`** so `process.env` is populated from `.env` for local and hosted runs that inject the same variable names.
