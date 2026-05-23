# Changes — Manual Investigation (Before Load Test)

Recorded before running Artillery. Server: `http://localhost:3001`, 1,000 in-memory quotes.

## Manual curl baseline

Commands used (PowerShell / curl):

```bash
curl -w "\nTime: %{time_total}s  Size: %{size_download} bytes\n" -o NUL -s http://localhost:3001/api/quotes/unpaginated
curl -w "\nTime: %{time_total}s  Size: %{size_download} bytes\n" -o NUL -s "http://localhost:3001/api/quotes?page=1&limit=20"
curl -X POST http://localhost:3001/api/favorites -H "Content-Type: application/json" -d "{\"quoteId\": 1}"
```

### GET `/api/quotes/unpaginated`

- **Response time:** ~15–80 ms idle (single user); degrades sharply under concurrency.
- **Payload size:** ~200–300 KB (full JSON array of 1,000 quotes).
- **Headers:** Uses `Transfer-Encoding: chunked` instead of `Content-Length` (intentional bug #2).
- **Behaviour:** Entire array serialized and streamed in one response — high memory and bandwidth per request.

### GET `/api/quotes?page=1&limit=20`

- **Response time:** ~2–10 ms idle (single user).
- **Payload size:** ~3–5 KB (20 quotes + pagination metadata).
- **Pagination metadata:** `currentPage: 1`, `total: 1000`, `data` length 20.
- **Suspicious:** `totalPages` reports **501** when it should be **50** for `limit=20` (off-by-one bug when 1000 ÷ 20 is exact — bug #3).
- **Suspicious:** `hasNextPage: true` on page 1 even though page 50 would be the last valid page with correct math.

### POST `/api/favorites`

- **Response time:** ~50–60 ms minimum per request (synchronous 50 ms busy-wait — bug #4).
- **Body:** `{ "success": true, "message": "Added to favorites" }`.
- **Suspicious:** No validation — empty body or missing `quoteId` still returns 200 and stores `undefined` (bug #5).

## Other intentional issues observed

| # | Issue | Effect under load |
|---|--------|-------------------|
| 1 | **CORS disabled** | Browser/client from another origin fails; Artillery (no browser CORS) still works |
| 2 | **Chunked unpaginated response** | Harder for clients to know size upfront; can add latency on slow networks |
| 3 | **Pagination off-by-one** | Wrong `totalPages` / `hasNextPage` in API contract |
| 4 | **Sync blocking on POST** | Event loop blocked 50 ms per favorite — throughput collapses when many POSTs run |
| 5 | **No input validation** | Invalid favorites pollute in-memory store |

## Expected load-test impact

- **Unpaginated GET** should show **higher median and p95** and **lower throughput** than paginated GET.
- **POST /favorites** should show **elevated p95** (~50 ms floor + queueing) and may contribute to **errors/timeouts** when combined with heavy GET traffic.
- Error rate may exceed zero if the server is overwhelmed (timeouts, connection resets).
