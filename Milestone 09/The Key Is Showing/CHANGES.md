# CHANGES — Secure OpenAI API key

## Before (evidence required)

- Exposed key location: `src/App.jsx` — line 9

- Screenshot showing the exposed key in DevTools Network tab (Authorization header):

  ![before](screenshots/before-devtools.png)

- Explanation (why VITE_ variables are not secret):

  Vite exposes variables prefixed with `VITE_` into the bundled frontend code at build time. These values are embedded in the client-side JavaScript and delivered to users' browsers, therefore any `VITE_` environment variable (including API keys) is visible to anyone who opens DevTools. Browser-side environment variables cannot be used to keep secrets.

Commit this `CHANGES.md` file before running the code changes that move the OpenAI key to the backend. The commit timestamp will prove the investigation happened before the fix.

## After (evidence required)

- Screenshot showing DevTools Network tab after the fix (no requests to api.openai.com and no Authorization header shown):

  ![after](screenshots/after-devtools.png)

- One-sentence billing risk summary:

  Exposed API keys allow attackers to run automated calls against the provider, resulting in unexpected charges with no guaranteed reimbursement — storing keys only on trusted server-side environments prevents this.
