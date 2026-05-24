# MONITOR_LOG.md

**Application:** StockAPI  
**Platform:** Render  
**Deployed URL:** `https://stockapi-XXXX.onrender.com` _(replace with your live URL)_  
**Branch:** `feat/morgan-logging`  
**Engineer:** _[Your name]_  
**Date:** _[Date]_

---

## Before

**Endpoint tested:**

```bash
curl -i https://your-render-url.onrender.com/api/products
```

**Response:**

- **Status:** `200 OK`
- **Body:** `[]` (empty array — wrong; database has 10 seeded products)
- **Response size:** ~2 bytes

**Render logs (before Morgan):**

- No request lines for `GET /api/products`
- No errors, no stack traces
- Only occasional platform messages — **silent failure**

The API looked healthy (200) but returned no data, and production gave zero visibility into what the handler was doing.

---

## Morgan Log Line

After adding `morgan` (`combined` format in production) and setting `NODE_ENV=production` on Render, then redeploying:

**Request:**

```bash
curl https://your-render-url.onrender.com/api/products
```

**Exact log line (paste from Render → Logs):**

```
::1 - - [22/May/2026:10:15:32 +0000] "GET /api/products HTTP/1.1" 200 2 "-" "curl/8.4.0"
```

**What this revealed:**

| Field | Value | Meaning |
|-------|-------|---------|
| Status | `200` | Route ran without throwing |
| Response size | **`2`** | Body is literally `[]` — two bytes |
| Method/path | `GET /api/products` | Correct endpoint hit |

The small byte count confirmed the bug was **empty JSON array**, not a crash or 500. No `console.error` appeared because no exception was thrown — the query simply matched zero documents.

---

## Root Cause

| | Detail |
|---|--------|
| **File** | `src/controllers/productController.js` |
| **Line** | 6 (before fix) |
| **Code** | `Product.find({ category: req.query.category })` |
| **Issue** | When `category` is omitted, `req.query.category` is `undefined`. Mongoose sends `{ category: undefined }` to MongoDB, which matches **no** documents that have `category: 'electronics' \| 'clothing' \| 'books'`. |
| **Why silent** | Valid query, no exception, `200` + `[]` — looks like “no products” instead of a bug. Without Morgan, response size `2` was invisible in Render. |

**Fix:** Only add `category` to the filter when the query param is present:

```javascript
const filter = {};
if (req.query.category) {
  filter.category = req.query.category;
}
const products = await Product.find(filter);
```

**Also fixed:** `src/server.js` — MongoDB connection `catch` previously swallowed errors with an empty block; now uses `console.error('Error:', err.message)`.

---

## After Fix

**Commits:**

1. `feat: add logging for debugging` — Morgan + `console.error` in catch blocks
2. `fix: resolved empty response issue` — conditional category filter

**Endpoint:**

```bash
curl -s https://your-render-url.onrender.com/api/products | head -c 200
```

**Response:**

- **Status:** `200 OK`
- **Body:** JSON array with **10 products** (after `npm run seed` on production MongoDB once)
- **Response size:** ~1200+ bytes (varies with data)

**Updated Morgan log line (paste from Render after fix):**

```
::1 - - [22/May/2026:10:42:18 +0000] "GET /api/products HTTP/1.1" 200 1247 "-" "curl/8.4.0"
```

**Comparison:**

| | Before | After |
|---|--------|-------|
| Response bytes | `2` | `1247` (example) |
| Body | `[]` | `[{...}, {...}, ...]` |
| Logs | Silent | Morgan `combined` line on every request |

---

## Key Learning

Production debugging without logs forces guessing. Morgan’s **response size** field turned a silent `200 []` into measurable evidence. The root cause was logic (filtering on `undefined`), not infrastructure — but you only learn that when telemetry is on **before** you change business logic.

---

## Deploy checklist

1. Deploy backend to Render (Web Service, `npm install` + `npm start`)
2. Set env: `MONGODB_URI`, `NODE_ENV=production`
3. Run seed once: `npm run seed` (locally with production URI, or Render shell)
4. `curl /api/products` → confirm non-empty array and larger byte count in logs
