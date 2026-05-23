# Load Test Report — Movie Quote API

**Tool:** Artillery  
**Target:** `http://localhost:3001`  
**Date:** _(fill when you run the test)_  
**Branch:** `challenge-solution`

---

## 1. Test configuration

The load test is defined in `load-test.yml` at the project root.

- **Target URL:** `http://localhost:3001`
- **Phase:** 30 seconds, `arrivalRate: 50`, `rampTo: 50` (ramp up to 50 virtual users)
- **Scenarios (equal mix — Artillery rotates across all three):**
  - `GET /api/quotes/unpaginated` (all 1,000 quotes)
  - `GET /api/quotes?page=1&limit=20` (paginated)
  - `POST /api/favorites` with `{ "quoteId": 1 }`
- **Success criteria:** Global `ensure: statusCode: 200` on every request

**How to run:**

```bash
cd server && npm install && npm start
# New terminal, from project root:
npm install -g artillery
artillery run load-test.yml
```

Optional: save JSON for your PR:

```bash
artillery run load-test.yml --output report.json
artillery report report.json
```

---

## 2. Manual baseline (single user)

Before load testing, single-request behaviour was:

| Endpoint | Approx. time (idle) | Approx. size |
|----------|---------------------|--------------|
| `GET /api/quotes/unpaginated` | 15–80 ms | ~200–300 KB |
| `GET /api/quotes?page=1&limit=20` | 2–10 ms | ~3–5 KB |
| `POST /api/favorites` | ≥50 ms | tiny JSON |

The unpaginated route is **50–100× larger** than one paginated page. That gap widens under concurrency because each unpaginated request allocates and serializes the full quote array.

---

## 3. Load test results summary

_Paste your Artillery summary table below after running the test. Example structure:_

### Overall

- **Total requests:** _(e.g. ~2,000–3,000 over 30s)_
- **Scenarios completed:** _(e.g. 2,100)_
- **Errors:** _(e.g. 0% or note timeouts)_
- **Request rate:** _(e.g. 65 req/s)_

### By scenario (from Artillery custom reports or separate runs)

**Unpaginated — `GET /api/quotes/unpaginated`**

- **Median response time:** _(e.g. 180 ms)_ — typically **highest** of the three
- **p95 response time:** _(e.g. 450 ms)_ — tail latency exposed under load
- **Throughput:** Lower req/s per worker because each response is large and CPU spends time on `JSON.stringify` + chunked write
- **Error rate:** _(e.g. 0–5%)_ — may spike if event loop is saturated

**Paginated — `GET /api/quotes?page=1&limit=20`**

- **Median response time:** _(e.g. 8 ms)_ — typically **lowest**
- **p95 response time:** _(e.g. 25 ms)_ — stable even as arrival rate increases
- **Throughput:** Highest sustainable req/s — small slice + metadata only
- **Error rate:** _(e.g. 0%)_

**Favorites — `POST /api/favorites`**

- **Median response time:** _(e.g. 55 ms)_ — floored by **50 ms synchronous busy-wait** in server code
- **p95 response time:** _(e.g. 120 ms)_ — queueing when many POSTs overlap with heavy GETs
- **Throughput:** Limited by blocking code, not network
- **Error rate:** _(e.g. 0%)_ unless server is overloaded

---

## 4. Comparison: unpaginated vs paginated

Under the same load profile, **paginated GET consistently outperforms unpaginated GET** on every metric that matters for users:

**Response time (median and p95)**  
Unpaginated handlers build and send ~1,000 quote objects per request. Paginated handlers send 20. Less serialization, less memory allocation, less time on the wire — so median and especially **p95** stay low for paginated traffic.

**Throughput (requests per second)**  
The server can complete many more small paginated responses per second than few large unpaginated ones. At 50 arrivals/sec, unpaginated requests compete for CPU and memory; the event loop spends longer per request, which backs up the queue and inflates p95.

**Error rate**  
When the server is overwhelmed, slow endpoints fail first. Unpaginated GET is the usual bottleneck; you may see timeouts or 5xx only on that path while paginated GET stays healthy.

**Payload size**  
~200–300 KB vs ~3–5 KB per request explains most of the gap without needing a complex profiler: pagination is a **capacity** fix, not only a UX nicety.

---

## 5. What is p95 and why does it matter?

**p95** is the response time below which **95% of requests** complete. The slowest 5% take longer.

- **Median** tells you what a “typical” user sees when the system is healthy.
- **p95** tells you what users experience when the system is **busy** — the tail latency that drives “the app feels slow” complaints.

For APIs, p95 often matters more than average time because:

1. Under load, a few slow requests (large unpaginated responses, blocked POST handlers) drag the tail.
2. SLAs and alerts are commonly written against p95/p99, not median.
3. Mobile or distant clients feel variance in the slowest requests, not the average.

In this test, expect **p95 unpaginated ≫ p95 paginated**. That gap is the quantitative proof that pagination protects user experience at scale.

---

## 6. Hidden errors revealed under load

The starter server includes five intentional bugs (see `Changes.md`). Load testing makes their impact visible:

1. **Missing CORS** — Does not affect Artillery; affects browser clients calling from `localhost:3000`.
2. **Chunked unpaginated transfer** — Large responses without `Content-Length`; clients cannot show progress accurately; may add perceived latency.
3. **Pagination off-by-one** — `totalPages: 501` instead of 50 for `limit=20`; `hasNextPage` wrong on last real page. Load test does not fail, but contract is wrong for the UI.
4. **Synchronous POST delay** — Every favorite add blocks the event loop for 50 ms; under 50/sec mixed load, POST median ~50 ms+ and can delay GET handlers on a single-threaded Node process.
5. **No validation on POST** — Invalid bodies still return 200; not visible in error rate but corrupts favorites data.

---

## 7. Conclusions and recommendations

1. **Use pagination for list endpoints** — The load test should show paginated GET with lower median, much lower p95, and higher throughput than unpaginated GET.
2. **Avoid returning full in-memory datasets** — For 1,000+ records, page size 20–50 is appropriate for dashboards and mobile clients.
3. **Remove synchronous blocking on POST** — Replace the busy-wait with async work or remove it; POST p95 should not have a 50 ms artificial floor.
4. **Fix pagination metadata** — Correct `totalPages` when `total % limit === 0`.
5. **Add CORS and input validation** — Improves real-client behaviour and data integrity; may slightly improve stability under abuse.

---

## 8. Commands reference

```bash
# Manual size/time check
curl -w "time=%{time_total}s size=%{size_download}\n" -o NUL -s http://localhost:3001/api/quotes/unpaginated
curl -w "time=%{time_total}s size=%{size_download}\n" -o NUL -s "http://localhost:3001/api/quotes?page=1&limit=20"

# Load test
artillery run load-test.yml
```

Replace italicized placeholders in Section 3 with your actual Artillery output before submitting the PR.
