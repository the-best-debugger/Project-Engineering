# BASELINE — Retro Game High Score Wall

**Project:** `milesotne 07/Performance Audit a Peer's Project` (Arcade Heroes)  
Measure locally, then replace placeholders with your numbers.

---

## Baseline (before fixes)

| Metric | Before (broken) |
|--------|-----------------|
| **GET /api/scores response time** | ~400–1,200 ms (300+ rows + large JSON) |
| **Payload size** | ~1.5–2.5 MB (includes `strategyNote` ~150 words × 300) |
| **API calls on page load** | **2** (React Strict Mode, no `AbortController`) |
| **React commit while typing** | ~80–200 ms per keystroke (filter on every render, all cards re-render) |
| **DOM nodes (score grid)** | ~12,000+ (300+ cards) |
| **gzip** | No `Content-Encoding: gzip` |
| **Search feel** | Laggy with 300 cards |

### Backend issues (before)

1. **B1 — No pagination:** `findMany()` returns all 300+ scores.
2. **B2 — Over-fetching:** Every row includes `strategyNote` (not shown in list UI).
3. **B3 — No compression:** Raw JSON over the wire.

### Frontend issues (before)

4. **F1 — Double fetch:** Strict Mode + no abort cleanup → duplicate `/api/scores` in Network tab.
5. **F2 — No `useMemo`:** Filter runs every render; typing triggers full list work.
6. **F3 — Unstable `onDelete`:** New function each render; `ScoreCard` not memoized → all cards re-render on any parent update.

---

## Fix 1 — Pagination (backend)

| | Before | After |
|---|--------|-------|
| Default response | 300+ records | **20** per page (`page`, `limit` params) |
| Metadata | none | `total`, `totalPages`, `hasNextPage`, `hasPrevPage` |

**Delta:** Paginated `?page=1&limit=20` payload drops from ~2 MB → **~30–50 KB**.

---

## Fix 2 — Trim payload (backend)

| | Before | After |
|---|--------|-------|
| Fields returned | All (incl. `strategyNote`) | `id`, `game`, `player`, `score`, `date` only |

**Delta:** Full-catalog fetch (`limit=350`) ~**80–90% smaller** than baseline.

---

## Fix 3 — gzip compression (backend)

| | Before | After |
|---|--------|-------|
| `Content-Encoding` | absent | **gzip** |

**Delta:** Wire size for paginated page ~**60–70% smaller** over network.

---

## Fix 4 — AbortController (frontend)

| | Before | After |
|---|--------|-------|
| Requests on mount | 2 | **1** (second aborted in Strict Mode) |

**Change:** `useEffect` with `signal` + cleanup `controller.abort()`.

---

## Fix 5 — `useMemo` search filter (frontend)

| | Before | After |
|---|--------|-------|
| Filter on keystroke | Every render | Only when `scores` or `searchTerm` change |
| Search feel | Laggy | **Instant** |

---

## Fix 6 — `useCallback` + `React.memo` (frontend)

| | Before | After |
|---|--------|-------|
| `handleDelete` | New reference each render | Stable `useCallback` |
| `ScoreCard` | Plain function | **`React.memo`** |
| Delete one card | All cards re-render | **Only removed card unmounts** |

---

## Total before / after

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Payload (`limit=20`) | ~2 MB | ~15–40 KB (~10 KB gzip) | **~98% smaller** |
| API calls on load | 2 | 1 | **50% fewer** |
| Search responsiveness | Poor | Good | ✓ |
| gzip | No | Yes | ✓ |
| Re-renders on delete | ~300 | ~1 | ✓ |

---

## Verification

```bash
# Backend
cd backend && npm install && npm run dev

# Response time + size (paginated)
curl -w "time=%{time_total}s size=%{size_download}`n" -o NUL -s "http://localhost:3001/api/scores?page=1&limit=20"

# gzip
curl -H "Accept-Encoding: gzip" -I "http://localhost:3001/api/scores?page=1&limit=20"

# Frontend
cd frontend && npm install && npm run dev
# Network: single GET /api/scores?page=1&limit=350
# Profiler: type in search — memoized filter, stable callbacks
```

---

## Git commits (suggested order)

```bash
git commit -m "perf: add pagination with metadata"
git commit -m "perf: trim payload – exclude strategyNote"
git commit -m "perf: enable gzip compression"
git commit -m "perf: fix double fetch with AbortController"
git commit -m "perf: useMemo for search filter"
git commit -m "perf: useCallback for stable handler + memo"
```
