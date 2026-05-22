# Still In? — Investigation & Fix Log

## Investigation (Before Fixes)

### Observed behaviour

1. Signed up and logged in as `test@example.com` — dashboard loads, poll auto-refreshes every 10 seconds.
2. After **60 seconds** (JWT `expiresIn: 1m`), the UI still shows the user as logged in (email in header, dashboard visible).
3. **Vote** after expiry: Network tab shows **`500 Internal Server Error`** with `{ message: "Invalid token", error: "jwt expired" }` — not `401`.
4. **Auto-refresh** continues every 10 seconds indefinitely (`GET /api/poll` is public, so it still succeeds).
5. **Duplicate votes**: same user can vote multiple times on different options — duplicate check never triggers.

---

## Issue 1 — Expired Token Returns Wrong HTTP Status

**File:** `server/middleware/auth.js`

**Problem:** The `catch` block returns **`500`** for all JWT errors, including `TokenExpiredError`.

**Discovery:** Network tab after 1 minute — vote request shows status **500**, not **401**. Frontend cannot distinguish “session ended” from “server broken.”

**Why dangerous:** Clients treat 500 as retry-worthy server faults; session expiry should force re-authentication (`401`), not look like infrastructure failure.

**Fix:** Return **`401 Unauthorized`** with a clear message when `err.name === 'TokenExpiredError'`; other invalid tokens also return `401`.

---

## Issue 2 — Voting Logic Allows Duplicate Votes

**File:** `server/routes/poll.js`

**Problem:**

```javascript
const alreadyVoted = votedUserIds.find(id => id === req.user.email);
// ...
votedUserIds.push(userId); // userId is req.user.id (number)
```

- `votedUserIds` stores **numeric user IDs** (`req.user.id`).
- The check compares against **`req.user.email`** (string).
- `number === string` is always **false** → duplicate check never matches.

**Discovery:** Code audit + voting twice as same user — both succeed.

**Why dangerous:** One account can inflate poll results without limit; integrity of the vote is broken.

**Fix:** Use consistent type — `votedUserIds.includes(userId)` where `userId = req.user.id`.

---

## Issue 3 — Frontend Ignores Authentication Errors

**File:** `client/src/api/client.js`

**Problem:** Only a **request** interceptor exists. No **response** interceptor for `401`. Errors bubble to components; token and user remain in `localStorage`.

**Discovery:** After expiry, `localStorage` still has `token` and `user`; `PrivateRoute` still renders dashboard.

**Why dangerous:** Stale credentials in the browser; user believes they are still authenticated; protected actions fail unpredictably (500 vs 401).

**Fix:** Axios response interceptor — on `401`, clear `token` and `user` from `localStorage`, dispatch session-expired event, redirect to `/login`.

---

## Issue 4 — Polling Interval Keeps Running After Expiry

**File:** `client/src/pages/Dashboard.jsx`

**Problem:** `setInterval(fetchPoll, 10000)` runs until unmount. On vote failure, only `alert()` — no `clearInterval`, no redirect. Public `GET /poll` keeps succeeding, so the UI looks alive.

**Discovery:** Console shows repeated poll fetches after expiry; footer timer hits 60s but dashboard never logs out.

**Why dangerous:** Wasted network/CPU; confusing UX (appears logged in); error noise in console; masks session expiry until user votes.

**Fix:** Listen for `auth:session-expired` and clear interval; clear interval on manual logout; optional client-side JWT `exp` check in poll loop to end session without waiting for a vote.

---

## Fixes Applied

### 1. Auth middleware — `server/middleware/auth.js`

**Before:**

```javascript
} catch (err) {
  res.status(500).json({ message: "Invalid token", error: err.message });
}
```

**After:**

```javascript
} catch (err) {
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
  return res.status(401).json({ message: "Invalid token" });
}
```

### 2. Duplicate vote check — `server/routes/poll.js`

**Before:** `votedUserIds.find(id => id === req.user.email)`

**After:** `votedUserIds.includes(userId)` where `userId = req.user.id`

### 3. Axios 401 interceptor — `client/src/api/client.js`

Added response interceptor: clear storage, `auth:session-expired` event, redirect to `/login`.

### 4. Polling cleanup — `client/src/pages/Dashboard.jsx`

- `clearInterval` on `auth:session-expired`
- `clearInterval` on manual logout
- JWT `exp` check before each poll tick to end session when token expires (even if user never votes)

---

## Verification

| Scenario | Before | After |
|----------|--------|-------|
| Vote with expired token | HTTP **500** | HTTP **401** |
| UI after expiry | Stays on dashboard | Redirects to **/login** |
| Polling after expiry | Runs forever | **Stops** (interval cleared) |
| Second vote same user | Allowed | **400** Already voted |

**Screenshots:** `screenshots/before-expiry-api.png`, `screenshots/after-expiry-api.png`, `screenshots/before-ui.png`, `screenshots/after-ui.png`

---

## Why the Old Behaviour Was Dangerous

Expired sessions were indistinguishable from server failures (`500`), so clients never cleared credentials. Users stayed on a “logged-in” UI while the backend rejected them. Duplicate voting broke poll integrity. Endless polling wasted resources and hid the real problem until manual action — a combination of poor security UX and data integrity failure.
