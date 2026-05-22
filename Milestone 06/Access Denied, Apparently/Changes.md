# Access Denied, Apparently — Investigation & Fix Log

## Investigation (Before Fixes)

**Setup:** Account A (`alice@example.com`) created a private event and invited Account B (`bob@example.com`). Logged in as Account B and tested access.

### Role Gap Audit

| # | Action | Endpoint | Result (broken) | Should be |
|---|--------|----------|-----------------|-----------|
| 1 | List all events | `GET /api/events` | **200** — every event in the system, including A's private events B was not invited to | Only events B created or was invited to |
| 2 | View event by ID | `GET /api/events/:id` | **200** — full title, description, guest list for any known ID | **403** if not creator and not in `invitedEmails` |
| 3 | RSVP to uninvited event | `POST /api/events/:id/rsvp` | **200** — RSVP succeeds | **403** if email not in `invitedEmails` |
| 4 | Duplicate RSVP | `POST /api/events/:id/rsvp` (again) | **200** — count increases again | **400** already RSVPed |
| 5 | Delete another user's event | `DELETE /api/events/:id` | **200** — event removed | **403** unless `req.user.id === creatorId` |
| 6 | UI buttons | `EventDetail.jsx` | RSVP and Delete shown to **any** logged-in viewer | Hidden unless `isInvited` / `isCreator` |

---

## Issue 1 — Unauthorized Event Discovery

**File:** `server/routes/events.js` — `GET /`

**Problem:** `res.json(events)` returns the entire in-memory array with no filter.

**Why dangerous:** Any authenticated user can enumerate private events they were never invited to — leaks titles, dates, and existence of confidential meetings.

**Fix:** Filter where `creatorId === req.user.id` OR `invitedEmails.includes(req.user.email)`.

---

## Issue 2 — Private Detail Disclosure

**File:** `server/routes/events.js` — `GET /:id`

**Problem:** Returns full event object if ID exists; no invitation check (flags were computed but access was never denied).

**Why dangerous:** ID guessing or leaked links expose private event details to strangers.

**Fix:** Return **403** when user is neither creator nor invitee.

---

## Issue 3 — RSVP Gatekeeping Bypass

**File:** `server/routes/events.js` — `POST /:id/rsvp`

**Problem:** No invitation check; `event.rsvps.push(req.user.id)` always runs; duplicates allowed.

**Why dangerous:** Pollutes guest counts; uninvited users can assert attendance at private events.

**Fix:** Require email in `invitedEmails`; reject duplicate with **400**.

---

## Issue 4 — Unauthorized Data Deletion

**File:** `server/routes/events.js` — `DELETE /:id`

**Problem:** Any authenticated user can delete any event by ID.

**Why dangerous:** Sabotage — Account B can wipe Account A's events.

**Fix:** Only allow delete when `event.creatorId === req.user.id`.

---

## Issue 5 — Misleading UI (Frontend Logic)

**File:** `client/src/pages/EventDetail.jsx`

**Problem:** RSVP and Delete buttons rendered for every logged-in user regardless of `isInvited` / `isCreator`.

**Why dangerous:** Security by UI only fails — users attempt actions that should not exist; encourages confusion when API eventually blocks (or doesn't, in the broken app).

**Fix:** Show RSVP only when `isInvited && !hasRSVPed`; show Delete only when `isCreator`; use `hasRSVPed` from API.

---

## Root Cause

The app implemented **authentication** (`authMiddleware` on all event routes) but not **authorisation**. Login proved identity, but no handler verified creator/invitee relationship before read, RSVP, or delete. The frontend trusted “logged in” instead of permission flags.

---

## What I Fixed

### Backend — `server/routes/events.js`

**Before (list):**

```javascript
res.json(events);
```

**After:**

```javascript
const visible = events.filter((event) => canAccessEvent(event, req.user));
res.json(visible);
```

**Before (detail):** returned event for any user.

**After:** `403` if `!canAccessEvent(event, req.user)`.

**Before (RSVP):** unconditional push to `rsvps`.

**After:** invitation check + duplicate check.

**Before (delete):** unconditional `splice`.

**After:** `403` unless `event.creatorId === req.user.id`.

### Frontend — `client/src/pages/EventDetail.jsx`

**Before:**

```jsx
<button onClick={handleRSVP}>RSVP for Event</button>
<button onClick={handleDelete}>...</button>
```

**After:**

```jsx
{showRSVP && <button onClick={handleRSVP}>...</button>}
{showDelete && <button onClick={handleDelete}>...</button>}
```

Where `showRSVP = event.isInvited && !event.hasRSVPed` and `showDelete = event.isCreator`.

---

## Verification Results

| Scenario | Account | Expected | Screenshot |
|----------|---------|----------|------------|
| Event list | B (not invited to A's event) | Only B's invited/own events | `after-list.png` |
| View private event | B | **403** | `after-detail-403.png` |
| RSVP uninvited | B | **403** | `after-rsvp-403.png` |
| Delete A's event | B | **403** | `after-delete-403.png` |
| Buttons on private event | B | Hidden (never loads detail) | `after-buttons.png` |
| Manager/creator flows | A | Create, invite, delete own event | `creator-ok.png` |

**Before screenshots:** `before-list.png`, `before-detail.png`, `before-rsvp.png`, `before-delete.png`, `before-buttons.png`

---

## Why Login Alone Is Not Enough

Authentication answers “who are you?” Authorisation answers “what may you do?” This app treated every valid JWT as full access to every event. Fixes enforce the invite-only model on every sensitive endpoint and align the UI with server-side permissions so users cannot see or trigger actions they are not entitled to perform.
