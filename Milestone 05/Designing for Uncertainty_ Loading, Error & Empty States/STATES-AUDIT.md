# ShopDash — States audit (Moves 1–6)

Use **Chrome DevTools → Network → Slow 3G**, reload each route, and observe the blank gap before data appears. This document captures the **baseline (pre-fix)** experience and the implementation plan.

---

## Move 1 — Identify the gaps (per screen)

### Dashboard (`/`)

| Phase | What the user sees today (pre-fix) |
|--------|-------------------------------------|
| **Loading** | The page heading renders immediately. The **4 stat cards area is an empty row** — white/transparent space where cards will appear. The chart placeholder box still shows static grey text. **No spinner, skeleton, or copy** explaining that metrics are loading. |
| **Error** | Same as a failed empty layout: **stats never appear**, chart placeholder remains. **No error banner, no retry.** User cannot tell if the network failed or data is zero. |
| **Empty** | Not modelled: API always returns a full stats object. **No dedicated “no data yet” state** if metrics were absent. |

### Orders (`/orders`)

| Phase | What the user sees today |
|--------|---------------------------|
| **Loading** | **Title “Recent Orders” and “Export Report” render**, but the list region is **completely blank** — no skeleton, no text. |
| **Error** | **Blank list** under the header; **no message**, no retry. |
| **Empty** | If the API returned `[]`, the list would stay **blank** with no explanation (indistinguishable from loading or error). |

### Products (`/products`)

| Phase | What the user sees today |
|--------|---------------------------|
| **Loading** | Header + filter buttons visible; **grid area is empty** — no skeleton cards. |
| **Error** | **Empty grid**, no feedback. |
| **Empty** | **Empty grid** with no “no products” vs “no search results” distinction. |

### Customers (`/customers`)

| Phase | What the user sees today |
|--------|---------------------------|
| **Loading** | **Table shell renders** (header row visible) but **tbody is empty** — looks like “zero customers” while still loading. |
| **Error** | Empty tbody, **no error UI**. |
| **Empty** | Empty tbody — **same as loading**, misleading. |

---

## Move 2 — Missing states checklist

| Screen | Loading | Error | Empty (no rows / no stats) |
|--------|:-------:|:-----:|:--------------------------:|
| Dashboard | Missing | Missing | Missing (not in API) |
| Orders | Missing | Missing | Missing |
| Products | Missing | Missing | Missing |
| Customers | Missing | Missing | Missing |

**Implementation checklist:** every row must become **Implemented** for all three columns (with Dashboard empty covered via demo mode or semantic “no metrics” when applicable).

---

## Move 3 — Loading plan (spinner vs skeleton)

**Decision:** Use **skeleton placeholders**, not a lone center spinner, for list/grid/table content so layout **does not jump** and users see the **shape** of incoming content.

**Reasoning (one sentence):** Skeletons preserve spatial structure (cards, stats, rows) and reduce perceived wait time compared to a blank canvas or a generic spinner.

### Orders list — skeleton plan (3–4 cards)

Mirror `OrderCard`: `bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center`.

**Shimmer / pulse utilities (exact Tailwind classes to implement):**

- Outer card: `bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center animate-pulse`
- Left column blocks: `h-4 bg-gray-200 rounded w-28 mb-2`, then `h-3 bg-gray-100 rounded w-40`
- Right column blocks: `h-4 bg-gray-200 rounded w-16 mb-2`, `h-5 bg-gray-100 rounded-full w-20`

Repeat **4** cards (`count={4}`).

**Optional shimmer upgrade (global):** extend Tailwind with `keyframes.shimmer` + `animation.shimmer` and add `bg-[length:200%_100%] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200` for stronger motion — implemented in `tailwind.config.js`.

### Other layouts

- **Products:** same pulse blocks inside a **taller card** (image area + lines) × `count` (default 6).
- **Customers:** **5 skeleton rows** in `tbody` (`variant="table-row"`, `count={5}`) under the real `<thead>`.
- **Dashboard:** **4 stat tiles** (`variant="stat"`, `count={4}`) + optional chart block skeleton.

---

## Move 4 — Error copy (before building `ErrorMessage`)

Each message answers **what went wrong** + **what to do next**. All use a **Retry** action wired to `refetch` from hooks.

| Screen | `message` prop (draft) |
|--------|------------------------|
| **Orders** | We couldn't load your orders. Check your connection and try again. |
| **Products** | We couldn't load your inventory. Check your connection and try again. |
| **Customers** | We couldn't load your customers. Check your connection and try again. |
| **Dashboard** | We couldn't load your dashboard metrics. Check your connection and try again. |

*(Hooks still expose `error` string from the API for debugging; the UI uses the copy above for consistency.)*

---

## Move 5 — Empty state copy (title, body, CTA)

### Orders — API returned `[]` (new account / cleared queue)

- **Title:** No orders yet  
- **Message:** When customers place orders, they will show up here. You can export a report once you have data.  
- **CTA:** `actionLabel` **Refresh** → `onAction={refetch}` (also covers “still nothing” after refresh).

### Orders — future: search with no results (not in starter API)

- **Title:** No matching orders  
- **Message:** Try adjusting filters or clearing your search.  
- **CTA:** **Clear filters** (wire when search exists; **not used** in starter).

### Products — empty inventory

- **Title:** No products in catalog  
- **Message:** Add your first product or sync from your warehouse tool to populate this list.  
- **CTA:** **Refresh** → `refetch`

### Customers — empty list

- **Title:** No customers yet  
- **Message:** Imported customers and storefront signups will appear in this table.  
- **CTA:** **Refresh** → `refetch`

### Dashboard — no metrics (demo / new tenant)

- **Title:** No overview data  
- **Message:** Connect your sales channels or import historical orders to see revenue and order metrics here.  
- **CTA:** **Refresh** → `refetch`

---

## Move 6 — Sketch (Orders: loading, error, empty)

Wireframe image for the **Orders** screen showing all three non-happy paths plus structure:

- **File:** `docs/orders-states-sketch.png`  
- **Also referenced from PR** for graders.

---

## Move 7–9 — Implementation notes (post–Move 6)

- **Components:** `src/components/states/` — `SkeletonCard.jsx`, `ErrorMessage.jsx`, `EmptyState.jsx`, barrel `index.js`.  
- **Integration order:** `isLoading` → `error` → empty (`Array.isArray(data) && data.length === 0`, Dashboard empty handled via demo flag) → happy path.  
- **Testing toggles (dev / screenshots):** `src/api/mockApi.js` reads query params, e.g. `?orders=empty`, `?orders=error`, same for `products`, `customers`, `dashboard`. See README.  
- **Screenshots:** capture real browser UI into `/screenshots` (minimum **6**). Placeholder PNGs may be committed as stubs — **replace with real captures** before final submission.

---

## Live deployment

_Add after deploy:_ see README **Live Deployment** section.
