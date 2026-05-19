# FocusForge Dashboard refactor — component architecture

## Summary

`DashboardPage.jsx` previously inlined the full dashboard: page chrome, header, stats grid, add-task form, filters, and task rows. It now owns state, derived values, and handlers only, and composes smaller components. Visual layout and behavior are unchanged (inline styles copied verbatim).

## Folder structure

```
src/
├── pages/
│   └── DashboardPage.jsx
├── components/
│   ├── dashboard/
│   │   ├── DashboardPageLayout.jsx
│   │   ├── DashboardHeader.jsx
│   │   ├── StatsRow.jsx
│   │   ├── AddTaskInput.jsx
│   │   ├── TaskFilterBar.jsx
│   │   └── TaskList.jsx
│   └── shared/
│       ├── StatCard.jsx
│       └── TaskItem.jsx
└── data/
    └── tasks.js
```

## Component responsibilities

| Component | Responsibility |
|-----------|----------------|
| **DashboardPage** | Holds task list, new-task text, filter, and search state; computes filtered list and summary stats; wires callbacks to children. |
| **DashboardPageLayout** | Full-page shell (background, typography) and centered main column; renders the header slot and main content. |
| **DashboardHeader** | Top bar: logo, product name, greeting, avatar placeholder. |
| **StatsRow** | Four-column stats grid for this page; maps summary numbers into **StatCard** instances (including the progress bar variant). |
| **AddTaskInput** | “Add New Task” labeled section: controlled input and add button; Enter triggers add via parent callback. |
| **TaskFilterBar** | Status filter buttons and search field; reports changes upward. |
| **TaskList** | Renders empty state when there are no visible tasks; otherwise maps each task to **TaskItem**. |
| **StatCard** (shared) | Generic metric tile: uppercase label, large value, optional subtitle, or optional custom **footer** (used for the progress bar). No dashboard-specific copy beyond what the parent passes. |
| **TaskItem** (shared) | One row: completion toggle, title + priority/tag chips, delete. No filter or list awareness. |

## `dashboard/` vs `shared/`

- **dashboard/** — Pieces that encode this screen’s structure or copy (FocusForge header, “Add New Task”, filter+search bar layout, stats *row* composition, list + empty state for this page).
- **shared/** — **StatCard** and **TaskItem** are presentation-only and usable elsewhere (e.g. mobile dashboard, analytics) without importing dashboard modules. They only receive data and callbacks via props.

## Props (contract)

### `DashboardPageLayout`

- `header` — React node (here, `<DashboardHeader />`).
- `children` — Main column content (stats, add task, filters, list).

### `StatsRow`

- `totalCount`, `completedCount`, `progressPercent` — Numbers derived in the page; keeps stat math in one place (`remaining` is derived inside the row to match the original layout).

### `AddTaskInput`

- `value` / `onChange` — Controlled input for the new task title.
- `onAdd` — Invoked on button click; parent also ties Enter via `onAdd` inside the component.

### `TaskFilterBar`

- `filter` / `onFilterChange` — Current filter key and setter.
- `searchQuery` / `onSearchChange` — Controlled search field.

### `TaskList`

- `tasks` — Already filtered/searched list from the page.
- `onToggleTask(id)` / `onDeleteTask(id)` — Passed through to each **TaskItem**.

### `StatCard`

- `label` — Uppercase metric name.
- `value` — Main number or string (e.g. `"42%"`).
- `valueColor` — Optional; defaults to `#e2e8f0`.
- `subtitle` — Small caption under the value (mutually exclusive with custom footer in usage).
- `footer` — Optional node under the value (progress bar); when set, subtitle is not used for that card.

### `TaskItem`

- `task` — Object with at least `id`, `title`, `completed`, `priority`, `tag`.
- `onToggle` / `onDelete` — Receive `task.id` from the parent handlers.

## Live deployment URL

_Add your deployed URL here after deploying (Vercel / Netlify / GitHub Pages), e.g._ `https://....vercel.app`

## If the app were 10× larger

- Introduce a thin **hooks** layer (`useTaskList`, `useTaskFilters`) to keep the page component readable and testable.
- Replace duplicated inline styles with **design tokens** + CSS modules or a small utility layer; keep component APIs stable.
- Split **domain types** and **API** modules from UI; add integration tests for filters and persistence.
- Consider **virtualized lists** if task counts grow; **TaskItem** would remain dumb, with list behavior in a container.

## Verification

After refactor, run `npm install` and `npm run dev`, then confirm: add task, Enter to add, toggle complete, delete, all/completed/active filters, and search — all match pre-refactor behavior and appearance.
