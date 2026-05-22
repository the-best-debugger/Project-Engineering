# Screenshots for PR

| File | What to capture |
|------|-----------------|
| `before-expiry-api.png` | Vote after 60s — **500** response in Network tab |
| `after-expiry-api.png` | Vote after 60s — **401** with session expired message |
| `before-ui.png` | Dashboard still visible after token expiry (broken) |
| `after-ui.png` | Redirect to login page after expiry (fixed) |

Optional: console showing polling stops after `auth:session-expired`.
