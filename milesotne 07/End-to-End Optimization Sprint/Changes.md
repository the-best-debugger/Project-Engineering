# Change Log

Detailed metrics: see **FINAL_REPORT.md**.

| # | Fix | File(s) |
|---|-----|---------|
| 1 | N+1 → nested `select` | `backend/src/index.js` |
| 2 | Pagination | `backend/src/index.js` |
| 3 | Payload trim | `backend/src/index.js` |
| 4 | gzip | `backend/src/index.js`, `compression` dep |
| 5 | Stable `CARD_STYLE` + memo | `frontend/src/components/MissionCard.jsx` |
| 6 | `useMemo` filter | `frontend/src/components/MissionList.jsx` |
| 7 | AbortController | `frontend/src/pages/MissionsPage.jsx` |
| 8 | Load More slicing | `frontend/src/components/MissionList.jsx` |
| 9 | `useCallback` delete | `frontend/src/pages/MissionsPage.jsx` |
