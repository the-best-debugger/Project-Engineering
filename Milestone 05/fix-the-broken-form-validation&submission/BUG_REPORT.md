# TrackFlow Bug Report Form — BUG_REPORT

This document records **reproduction**, **symptom**, and **root cause** for each issue in the starter `App.jsx`, **before** fixes. Root cause explains *why* the code behaves that way, not only what the user sees.

---

## Bug #1 — Empty submission still goes to the API

**Reproduce:** Leave all fields blank → click **Submit Bug Report** → wait ~1.8s → a new bug appears in “Filed This Session” with empty strings.

**Symptom:** Required fields do not block submission.

**Root cause:** `validate()` is hardcoded to `return true`, and `handleSubmit` calls `validate()` but **discards its return value** and never branches. There is no gate such as “if validation failed, `setErrors` and `return`”. So the `try` block always runs and `submitBugReport` always runs.

---

## Bug #2 — Double submission / button never disables

**Reproduce:** Fill all required fields correctly → double-click **Submit** quickly → Network (or list) shows multiple in-flight or multiple new bugs.

**Symptom:** Users can trigger several submissions while the mock API is still pending.

**Root cause:** `setLoading(true)` is **never called** before `await submitBugReport(form)`, and `finally` never sets loading back. The submit button has **no** `disabled={loading}` and no “Submitting…” label, so the UI never enters a locked state. Even if `loading` existed in state, it was not wired to the button or lifecycle.

---

## Bug #3 — Form fields stay filled after success

**Reproduce:** Submit a valid bug → green success banner appears → inputs still show the old values.

**Symptom:** Users cannot tell at a glance that they are ready to file another bug; risk of accidental duplicate submit.

**Root cause:** On the success path, only `setSuccessId`, `setSubmitted`, and related state run. There is **no** `setForm(...)` reset to initial empty values, so controlled inputs keep prior `form` state.

---

## Bug #4 — Server errors disappear (e.g. title contains `"login"`)

**Reproduce:** Fill the form with a title like **“login page broken”** → submit → after delay, nothing: no banner, no field message.

**Symptom:** API rejects with a structured error (`api.js` rejects with `{ status, message, field }`), but the user sees no feedback.

**Root cause:** The `catch` block is **empty**. Errors are swallowed instead of being mapped to `setServerError` or field-level `setErrors`. An empty `catch` is worse than no `try/catch` in some ways: it *guarantees* failures become invisible while still preventing uncaught rejections from surfacing in devtools as an unhandled rejection in some setups.

---

## Bug #5 — No per-field validation messages in the UI

**Reproduce:** Fill everything except **Bug Title** → submit → no red text under Title (and `errors.title` is never referenced in JSX).

**Symptom:** User does not know which field failed.

**Root cause:** `errors` state exists and `validate()` was intended to populate it, but **`setErrors` is never called** from `handleSubmit`, and the JSX never reads `errors.*` to show messages or error borders. Validation and UI were never connected.

---

## Bug #6 — “No. of Steps” accepts empty, `0`, and negatives

**Reproduce:** Enter **`-5`** (or `0`, or leave blank) with other fields valid → submit → accepted.

**Symptom:** Invalid step counts are stored and shown in the filed list.

**Root cause:** Same as Bug #1: `validate()` performs no checks. There is no rule that `stepsCount` must be a **positive integer ≥ 1**, and no normalization/parse step before treating it as a count.

---

## Cross-cutting maintainability note

Validation, loading, reset, and error surfacing were all **partially scaffolded** (`errors`, `loading`, `serverError`, banners in JSX) but **not completed** in the submit/change handlers. That mismatch is why the form *looks* close to done but fails under real use.

---

## Live deployment URL

_Add after deploy (e.g. Vercel / Netlify):_ `https://YOUR-DEPLOYMENT.example`
