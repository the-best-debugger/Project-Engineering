# ShopDash

React e-commerce dashboard demo used to practice **loading**, **error**, and **empty** UI states.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use Chrome DevTools → **Network** → **Slow 3G** to observe loading skeletons.

## Live deployment

_Add your production URL after deploying (Vercel / Netlify):_

**Live app:** `https://YOUR-DEPLOYMENT.example`

## States audit & sketch

See [STATES-AUDIT.md](./STATES-AUDIT.md) (Moves 1–6). Wireframe sketch: [docs/orders-states-sketch.png](./docs/orders-states-sketch.png).

## Simulate error / empty (dev & screenshots)

Query flags are read in `src/api/mockApi.js`:

| URL suffix | Effect |
|------------|--------|
| `?orders=empty` | Orders list returns `[]` |
| `?orders=error` | Orders request throws |
| `?products=empty` / `?products=error` | Same for products |
| `?customers=empty` / `?customers=error` | Same for customers |
| `?dashboard=empty` | Dashboard shows empty metrics state |
| `?dashboard=error` | Dashboard request throws |

Example: `http://localhost:5173/orders?orders=error`

## Screenshots

Capture real browser screenshots into `/screenshots` for your PR (see folder README). Placeholder images may be present only as layout stubs—**replace with real captures** before submission.

## Reusable state components

- `src/components/states/SkeletonCard.jsx` — `count`, `variant` (`order` \| `product` \| `stat` \| `table-row`)
- `src/components/states/ErrorMessage.jsx` — `message`, optional `onRetry`
- `src/components/states/EmptyState.jsx` — `title`, `message`, optional `actionLabel` + `onAction`
- Barrel: `src/components/states/index.js`
