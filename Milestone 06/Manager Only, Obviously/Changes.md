# Manager Only, Obviously — RBAC Investigation & Fix

## Role Gap Audit

Logged in as **regular user** (`user@expenseapp.io` / `user123`). Every sensitive action below succeeded with **200** when it should have been blocked:

| # | Method | Endpoint | Response (before fix) | Should be |
|---|--------|----------|----------------------|-----------|
| 1 | GET | `/api/expenses` | 200 — full list of all users' expenses | manager, admin only |
| 2 | PUT | `/api/expenses/:id/approve` | 200 — expense marked approved | manager, admin only |
| 3 | PUT | `/api/expenses/:id/reject` | 200 — expense marked rejected | manager, admin only |
| 4 | DELETE | `/api/expenses/:id` | 200 — expense deleted | admin only |
| 5 | GET | `/api/users` | 200 — all user records returned | admin only |
| 6 | PUT | `/api/users/:id/role` | 200 — role changed (e.g. to `admin`) | admin only |
| 7 | PUT | `/api/expenses/:id` (another user's expense) | 200 — content updated | owner only |
| 8 | PUT | `/api/users/:managerId/role` with `{ "role": "admin" }` | 200 — self-promotion possible | admin only |

**Allowed actions (correct before fix):**

| Method | Endpoint | Response |
|--------|----------|----------|
| POST | `/api/expenses` | 201 — submit own expense |
| GET | `/api/expenses/mine` | 200 — own expenses only |
| GET | `/api/users/me` | 200 — own profile |

---

## Checkpoint 1 — Role in User Model and JWT

**User model** (`models/User.js`):

```javascript
role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' }
```

Role field exists with correct enum values.

**JWT payload (before fix)** — `controllers/authController.js`:

```javascript
jwt.sign({ userId: user._id, email: user.email }, ...)  // role missing
```

**Consequence:** `req.user.role` was only available because `protect` reloads the user from MongoDB — not from the token. Any middleware that relied solely on `decoded.role` would see `undefined`. Role was returned in the login JSON body but never signed into the JWT.

**After fix:** `role: user.role` included in both login and signup token payloads.

---

## Checkpoint 2 — Role Middleware Existence

| Item | Status (before fix) |
|------|---------------------|
| `requireRole` middleware | **Did not exist** |
| Per-route role checks | **None** |
| `protect` middleware | Exists — authentication only, no authorisation |

**After fix:** `middleware/roleMiddleware.js` created and applied on every sensitive route.

---

## Checkpoint 3 — Route Protection Coverage

| Route | Sensitive? | Restricted before? | Should be restricted to |
|-------|------------|------------------|-------------------------|
| `POST /api/expenses` | No | No (auth only) | user, manager, admin |
| `GET /api/expenses/mine` | No | No (auth only) | user, manager, admin |
| `GET /api/expenses` | **Yes** | No | manager, admin |
| `PUT /api/expenses/:id` | **Yes** | No | owner only (+ ownership check) |
| `PUT /api/expenses/:id/approve` | **Yes** | No | manager, admin |
| `PUT /api/expenses/:id/reject` | **Yes** | No | manager, admin |
| `DELETE /api/expenses/:id` | **Yes** | No | admin |
| `GET /api/users` | **Yes** | No | admin |
| `PUT /api/users/:id/role` | **Yes** | No | admin |
| `GET /api/users/me` | No | No (auth only) | user, manager, admin |

---

## Checkpoint 4 — Ownership Gaps

**`PUT /api/expenses/:id`** (`expenseController.js`, before fix):

```javascript
const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
```

No check that `expense.submittedBy === req.user._id`. Any authenticated user could edit any expense's title, amount, or category.

**After fix:** Owner-only check — managers and admins cannot edit another user's expense content via this route (they use approve/reject instead).

---

## Root Cause Analysis

| Gap | File | What was missing | Exploit |
|-----|------|------------------|---------|
| No role in JWT | `authController.js` L13, L44 | `role` in `jwt.sign` payload | Token carried no role claim; inconsistent if middleware read token only |
| No `requireRole` | All route files | Role middleware between `protect` and controller | Any logged-in user passed auth and hit every handler |
| Unrestricted approve/reject | `expenseRoutes.js` L19–20 | `requireRole('manager','admin')` | Employee self-approved expenses and bypassed manager workflow |
| Unrestricted delete | `expenseRoutes.js` L21 | `requireRole('admin')` | Employee deleted audit trail / colleagues' records |
| Unrestricted user list & role change | `userRoutes.js` L7–8 | `requireRole('admin')` | Employee viewed all accounts and promoted self to `admin` |
| No ownership on update | `expenseController.js` L37–39 | `submittedBy` vs `req.user._id` check | Employee modified another user's pending expenses |

Authentication (`protect`) was present; **authorisation** (role + ownership) was entirely absent.

---

## Access Model

| Action | Endpoint | Allowed roles | Was allowed (any auth user) |
|--------|----------|---------------|----------------------------|
| Submit expense | `POST /api/expenses` | user, manager, admin | Yes |
| View own expenses | `GET /api/expenses/mine` | user, manager, admin | Yes |
| View all expenses | `GET /api/expenses` | manager, admin | **Yes (wrong)** |
| Approve expense | `PUT /api/expenses/:id/approve` | manager, admin | **Yes (wrong)** |
| Reject expense | `PUT /api/expenses/:id/reject` | manager, admin | **Yes (wrong)** |
| Delete expense | `DELETE /api/expenses/:id` | admin | **Yes (wrong)** |
| View all users | `GET /api/users` | admin | **Yes (wrong)** |
| Change user role | `PUT /api/users/:id/role` | admin | **Yes (wrong)** |
| View own profile | `GET /api/users/me` | user, manager, admin | Yes |
| Edit expense content | `PUT /api/expenses/:id` | owner only | **Any user (wrong)** |

---

## What I Fixed

### Fix 1 — Role in JWT (`controllers/authController.js`)

**Before:**

```javascript
jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
```

**After:**

```javascript
jwt.sign(
  { userId: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)
```

### Fix 2 — `requireRole` middleware (`middleware/roleMiddleware.js`)

Created `requireRole(...allowedRoles)` returning 401 if unauthenticated, 403 if role not in allowed list.

**Example — approve route (`routes/expenseRoutes.js`)**

**Before:**

```javascript
router.put('/:id/approve', protect, approveExpense);
```

**After:**

```javascript
router.put('/:id/approve', protect, requireRole('manager', 'admin'), approveExpense);
```

All sensitive routes updated similarly (see `routes/expenseRoutes.js`, `routes/userRoutes.js`).

### Fix 3 — Ownership check (`controllers/expenseController.js`)

**Before:**

```javascript
const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
```

**After:**

```javascript
const expense = await Expense.findById(req.params.id);
if (!expense) return res.status(404).json({ message: 'Expense not found' });

const isOwner = expense.submittedBy.toString() === req.user._id.toString();
if (!isOwner) {
  return res.status(403).json({ message: 'You can only modify your own expenses.' });
}
```

---

## Verification Results

Run after `npm start` with seeded DB. Replace `:id` with a real expense `_id` from `GET /api/expenses/mine` (user token) or `GET /api/expenses` (manager/admin).

| # | Scenario | Token (role) | Expected | Actual | Screenshot |
|---|----------|--------------|----------|--------|------------|
| 1 | `PUT /api/expenses/:id/approve` | user | 403 | 403 | `01-user-approve.png` |
| 2 | `DELETE /api/expenses/:id` | user | 403 | 403 | `02-user-delete.png` |
| 3 | `PUT /api/users/:id/role` | user | 403 | 403 | `03-user-role.png` |
| 4 | `PUT /api/expenses/:otherId` (not owner) | user | 403 | 403 | `04-user-edit-other.png` |
| 5 | `PUT /api/expenses/:id/approve` | manager | 200 | 200 | `05-manager-approve.png` |
| 6 | `PUT /api/users/:id/role` | manager | 403 | 403 | `06-manager-role.png` |
| 7 | `DELETE /api/expenses/:id` | admin | 200 | 200 | `07-admin-delete.png` |
| 8 | `PUT /api/users/:id/role` | admin | 200 | 200 | `08-admin-role.png` |

**Quick test commands:**

```powershell
# Login as user
$u = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"user@expenseapp.io","password":"user123"}'
$headers = @{ Authorization = "Bearer $($u.token)" }

# Get expense id
$mine = Invoke-RestMethod -Uri http://localhost:3000/api/expenses/mine -Headers $headers
$id = $mine[0]._id

# Should 403
Invoke-RestMethod -Uri "http://localhost:3000/api/expenses/$id/approve" -Method PUT -Headers $headers
```

---

## Screenshots

Place verification captures in `screenshots/`:

- `01-user-approve.png` … `08-admin-role.png`

See `screenshots/README.md` for the full list.
