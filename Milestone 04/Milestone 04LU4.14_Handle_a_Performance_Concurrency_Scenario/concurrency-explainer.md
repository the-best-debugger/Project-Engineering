# Concurrency Explainer

**Your name:** Yogitharao
**Date:** 2026-04-22

---

## The Root Cause — Why Check-Then-Insert Fails

<!-- 
  Explain what a race condition is in the context of this endpoint.
  Why does checking with findFirst() before creating with create() fail 
  when two requests arrive at the same millisecond?
  What is the "gap" between the check and the insert?
  
  Minimum: 2 paragraphs
-->

The original endpoint used a check-then-insert flow: first `findFirst()` to see whether a booking already existed for `(seatId, showId)`, then `create()` if nothing was found. That sounds reasonable in single-user testing, but it breaks when two requests arrive at almost the same moment. Both requests can run `findFirst()` before either one completes `create()`. Since both checks happen against the same pre-insert state, both get "no booking found" and both proceed to insert.

That timing window between the read (`findFirst`) and write (`create`) is the race condition. It is not about slow code; it is about two independent requests interleaving in a way that violates business rules. Under flash-sale traffic, this interleaving is common. Even if each request finishes quickly, the check and insert are still separate operations, so the seat can be sold twice before the system notices. The application logic appears correct in sequence but is not safe under concurrency.

---

## Why the Unique Constraint Fixes It

<!--
  Explain why moving the check from application code (findFirst) to the
  database level (@@unique constraint) actually closes the race condition.
  
  Why can't application-layer checking solve this, no matter how fast it runs?
  What does the database do differently that makes it atomic?
  
  Minimum: 1 paragraph
-->

Adding `@@unique([seatId, showId])` moves correctness enforcement to the database, where insert validation is atomic. Instead of asking the app to "look first, then decide," we ask the database to enforce "this combination can exist only once." With that rule in place, concurrent inserts for the same seat/show cannot both succeed: one insert wins, and the other is rejected by the database with a unique constraint violation. This closes the race at the only layer that sees all writes with transactional guarantees. Application checks can improve UX, but they cannot replace a database invariant for true conflict prevention.

---

## Why Rate Limiting Alone Is Not Enough

<!--
  Explain why adding express-rate-limit without the @@unique constraint
  would still allow double bookings.
  
  Give a concrete scenario: two users, one request each, both within the limit.
  What happens without the constraint?
  
  Minimum: 1 paragraph
-->

Rate limiting protects capacity, not data integrity. It reduces abusive traffic by capping requests per IP (here, 10 per minute), which helps keep the API responsive during bursts or bot floods. However, rate limiting alone does not prevent double booking. Example: User A and User B each send one valid request for the same seat at the same time. Both are under limit, so both requests pass the limiter. Without the unique constraint, both may still insert successfully. So rate limiting is an outer defense against overload; the unique constraint is the inner defense against logical conflicts. You need both layers.

---

## What P2002 Means and Why 409

<!--
  What does Prisma error code P2002 mean?
  Why is 409 Conflict the correct HTTP status to return when it fires?
  Why not 400 Bad Request? Why not 500 Internal Server Error?
  
  Minimum: 1 paragraph
-->

Prisma error `P2002` means a unique constraint was violated. In this system, it indicates that another booking already exists for the same `(seatId, showId)` pair. Returning HTTP `409 Conflict` is correct because the request is syntactically valid but conflicts with the current state of the resource. Returning `500` would incorrectly imply a server failure, and returning `400` would imply malformed input. Neither is accurate. By mapping `P2002` to `409`, clients can handle the response predictably (for example, show "Seat already booked, pick another seat") and retries can be smarter instead of blind.

---

**Total word count:** 441
