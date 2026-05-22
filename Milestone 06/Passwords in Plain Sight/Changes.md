# Passwords in Plain Sight — Investigation & Fix

## What I Found

After signing up with `test@example.com` / `password123` and inspecting the user document in MongoDB (`credapp` → `users` collection), the stored record looked like:

```json
{
  "_id": "<ObjectId>",
  "email": "test@example.com",
  "password": "password123",
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>",
  "__v": 0
}
```

**Password field value:** `password123`

**Category:** **Plain text** — the password is stored exactly as submitted, with no hashing or encoding.

---

## Checkpoint 1 — Signup

**File:** `backend/controllers/authController.js` — `signup` handler (`POST /api/auth/signup`)

**Flow:** `req.body.password` → passed directly to `User.create({ email, password })` with no transformation.

**Findings:**

- The password is **not** transformed before being stored.
- There is **no** reversible encoding (no base64, etc.) — it is raw plain text.
- **`bcrypt.hash()` is not called** anywhere in the signup flow.
- Comment in code explicitly states: `// Password stored directly — no hashing` and `password, // plain text stored here`.

---

## Checkpoint 2 — The Database Record

**Evidence:** `password` field value = `password123` (identical to the signup input).

**Category:** **Plain text**

If it had been base64, it would look like `cGFzc3dvcmQxMjM=`. If correctly hashed with bcrypt, it would start with `$2b$10$`. Neither applies — this is readable plain text.

---

## Checkpoint 3 — Login Comparison

**File:** `backend/controllers/authController.js` — `login` handler (`POST /api/auth/login`)

**Unsafe comparison (line 43):**

```javascript
if (user.password !== password) {
  return res.status(401).json({ message: 'Invalid credentials' })
}
```

**Findings:**

- Uses **`!==`** (strict string equality) to compare submitted password to stored value.
- Does **not** use `bcrypt.compare()`.
- No transformation of the submitted password before comparison — both sides are plain strings.
- This only works because passwords are stored in plain text; it would fail against bcrypt hashes.

---

## Checkpoint 4 — The User Model

**File:** `backend/models/User.js`

| Feature | Present? |
|--------|----------|
| `pre('save')` hook to hash password | **No** |
| `select: false` on password field | **No** |
| Password validation (minlength, etc.) | **No** |
| Basic schema (`email`, `password` required) | **Yes** |

The model is a bare Mongoose schema with no security hooks or field protections.

---

## Root Cause

Passwords are stored in plain text because the signup controller passes `req.body.password` directly into `User.create()` without hashing. The User model has no `pre('save')` hook to hash on write. Login then uses direct string comparison (`user.password !== password`), which only works when storage is plain text. The vulnerability is intentional in the challenge codebase — one line in signup (`password, // plain text stored here`) and one line in login (`user.password !== password`) are the entire unsafe path.

---

## Why This Is Dangerous

If an attacker gains read access to the database (SQL/NoSQL injection, misconfigured backup, stolen credentials, insider access, or a separate breach that exposes the DB), they immediately obtain every user's actual password. Users often reuse passwords across Gmail, banking, and work accounts, so one DB dump enables **credential stuffing** at scale: attackers try `email + password` on other sites and frequently succeed. Plain-text storage also means anyone with DB read access (developers, support tools, logs) can see secrets without cracking. A single breach becomes catastrophic because recovery is impossible — you cannot "rotate" a leaked plain-text password; users must change it everywhere manually.

---

## What I Fixed

### Fix 1 — Hash the password before storing (signup)

**Before:**

```javascript
const user = await User.create({
  email,
  password, // plain text stored here
})
```

**After:**

```javascript
import bcrypt from 'bcryptjs'

const saltRounds = 10
const hashedPassword = await bcrypt.hash(password, saltRounds)

const user = await User.create({
  email,
  password: hashedPassword,
})
```

### Fix 2 — Compare safely during login

**Before:**

```javascript
if (user.password !== password) {
  return res.status(401).json({ message: 'Invalid credentials' })
}
```

**After:**

```javascript
import bcrypt from 'bcryptjs'

const isMatch = await bcrypt.compare(password, user.password)
if (!isMatch) {
  return res.status(401).json({ message: 'Invalid credentials' })
}
```

**Dependency added:** `bcryptjs` via `npm install bcryptjs`

---

## Verification

| Test | Expected result |
|------|-----------------|
| Sign up new account (`newuser@example.com`) | `password` in DB starts with `$2b$10$` |
| Login with correct credentials | 200 + JWT |
| Login with wrong password | 401 `Invalid credentials` |
| Old plain-text users | Must sign up again (old hashes incompatible with bcrypt compare) |

**Screenshots (add to `screenshots/` for PR):**

- `screenshots/before-db.png` — user record showing `password: "password123"` (plain text)
- `screenshots/after-db.png` — user record showing `password: "$2b$10$..."` (bcrypt hash)

*Capture these in MongoDB Compass after signup before fix, and after fix with a new account.*
