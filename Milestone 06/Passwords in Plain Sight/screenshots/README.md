# Screenshots for PR

Add these two images before opening your pull request:

1. **before-db.png** — MongoDB Compass (or similar) showing a user with `password: "password123"` (plain text), captured *before* applying the bcrypt fix.
2. **after-db.png** — Same tool showing a new user after the fix with `password` starting with `$2b$10$`.

Embed both in the PR description:

```markdown
### Before
![Before fix](./screenshots/before-db.png)

### After
![After fix](./screenshots/after-db.png)
```
