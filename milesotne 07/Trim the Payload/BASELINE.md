# Trim the Payload — Baseline Measurements

Recorded **before** applying performance fixes. Environment: SQLite, 500 seeded orders, `GET /api/orders`.

## Observations

| Metric | Broken behaviour |
|--------|------------------|
| **Response time (TTFB)** | ~1.5–2.5s (500 orders × N+1 queries + sync blocking) |
| **Payload size** | ~1.2–1.8 MB JSON (all orders, full user/product/category blobs) |
| **DB queries per request** | **1 + 500 + 500 = 1,001+** (1 `findMany` orders + per-order user + per-order items) |
| **Pagination** | None — entire dataset returned |
| **Compression** | No `Content-Encoding: gzip` header |
| **Event loop** | Sync `map` with artificial 1ms busy-wait per order (~500ms+ blocked) |

## Issue 1 — Sequential N+1 fetching

`server/src/index.ts` loads all orders, then **for each order**:

- `prisma.user.findUnique`
- `prisma.orderItem.findMany` with `include: { product: true }`

For **500 orders** → **~1,001 queries**. At 10,000 orders → **~20,001 queries**.

## Issue 2 — No pagination

No `page` or `limit` query params. `findMany()` returns every row. Network tab shows multi‑MB response; UI renders 500 table rows at once.

## Issue 3 — Data bloat (over-fetching)

Uses `include` / spread of full models. Fields returned but **not shown in the orders table**:

- `user.address`, `user.bio`, `user.role`
- `product.description`, `product.stock`, `product.categoryId`
- `category.description`
- `order.updatedAt`, `_metadata` (added in processing)
- Full nested objects via `{ ...order, user, items }`

## Issue 4 — Blocked event loop

```typescript
const processedData = ordersWithDetails.map(order => {
  const start = Date.now();
  while (Date.now() - start < 1) { /* Artificial 1ms block per order */ }
  return { ...order, _metadata: { processedAt: ... } };
});
```

Synchronous busy-wait blocks the Node event loop for ~500ms+ on this request alone.

## Issue 5 — No compression

Express stack has no `compression` middleware. Raw JSON over the wire; slow on 3G.

---

## After fixes (target)

| Metric | Target |
|--------|--------|
| Response time | < 100ms |
| Payload (page of 20) | < 50 KB (gzip smaller) |
| DB queries | **1–3** (findMany + count + optional aggregate) |
| Pagination | `?page=1&limit=20` with metadata |
| Compression | `Content-Encoding: gzip` |

---

## After measurements (fill when verified)

| Metric | After |
|--------|-------|
| Response time | |
| Payload size (page 1, limit 20) | |
| DB queries (terminal log) | |
| gzip header present | yes / no |
