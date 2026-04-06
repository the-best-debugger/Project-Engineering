# Pair Version

This folder contains the task manager app built using an AI pair-programming style (simulated here with modular code).

**Tool used:** GitHub Copilot / Cursor (choose when you perform the interactive experiment)
**Time to build:** ~9 minutes (wall-clock while scaffolding here)
**Suggestions accepted:** (when you try this: record accepted vs rejected suggestions)
**Live URL:** (add after deployment)

## Files generated (count)
- index.html
- style.css
- app.js
- src/store.js
- src/components/TaskList.js
- src/components/TaskItem.js
- docs/index.html

Total files added: 7

## Observations
- Structure: modular ES module files, small focused modules (`store.js`, `TaskList`, `TaskItem`).
- Components / Names: `createStore`, `TaskList`, `TaskItem` — clear responsibilities.
- Editability: easier to extend and test; logic separated so adding features is lower risk.

## Deploy
- For GitHub Pages: copy `pair-version/docs` into repo `docs/` or publish branch `gh-pages` with the contents.
- For Netlify/Vercel: connect repository or drag & drop `pair-version/docs` folder (or serve the root built files).

