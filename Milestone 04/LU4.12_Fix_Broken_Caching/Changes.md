# Caching Reliability Fixes

## Issues Found

1. **Shared cache key for different responses**
   - `GET /tasks` used one global key (`global_data_key`) which could lead to collisions and inconsistent responses.

2. **Stale cache after mutations**
   - After create/delete operations, list/detail cache entries were not invalidated, so deleted tasks still appeared and fresh data did not show up reliably.

3. **No cache expiration (TTL)**
   - Cached entries were stored indefinitely in memory, causing memory growth and stale data risk.

4. **Async misuse**
   - A promise from Prisma (`findMany`) was cached before resolution, which could produce unpredictable behavior.

5. **Null/invalid responses cached**
   - `GET /tasks/:id` cached null values for non-existent tasks, creating permanent bad cache entries.

6. **Incorrect HTTP status and weak error handling**
   - Handlers returned `200` in situations that should be `201`, `204`, `404`, or `400`.
   - Errors were logged but not returned with useful HTTP responses.

7. **No update-flow cache strategy**
   - The system had no update endpoint with cache invalidation, so update consistency guarantees were missing.

---

## Improvements Implemented

### 1) Refactored cache into a service layer

- Added `backend/src/services/cacheService.js` with:
  - namespaced key helpers:
    - `tasks:list`
    - `task:<id>`
  - TTL support for every entry (default 60 seconds)
  - lazy expiration on reads
  - targeted invalidation helper (`invalidateTask`)
  - guard against caching `null`/`undefined`

### 2) Fixed GET cache behavior

- `GET /tasks`
  - Reads from `tasks:list`
  - Caches resolved DB results only (no promises)

- `GET /tasks/:id`
  - Validates numeric `id`
  - Returns `404` when task is missing
  - Does not cache null values
  - Uses `task:<id>` namespaced keys

### 3) Added mutation-safe cache invalidation

- `POST /tasks`
  - invalidates `tasks:list`
  - caches newly created task by `task:<id>`

- `DELETE /tasks/:id`
  - invalidates both list and detail cache via `invalidateTask`

- `PUT /tasks/:id` (added)
  - supports partial updates
  - invalidates affected cache keys and stores updated detail
  - improves consistency after updates

### 4) Corrected HTTP semantics and error handling

- `POST /tasks` now returns `201`
- `DELETE /tasks/:id` now returns `204`
- Invalid IDs or payloads return `400`
- Missing tasks return `404`
- Unexpected failures return `500` with explicit error messages

---

## Why This Improves Reliability

- **Consistency:** cache invalidation on create/update/delete keeps API data aligned with DB state.
- **Predictability:** only resolved, valid values are cached; no promises or null payloads.
- **Memory efficiency:** TTL ensures cache entries expire and do not accumulate forever.
- **Correct client behavior:** proper HTTP status codes make frontend/API integration more robust and debuggable.
