# ShopFlat — folder structure plan

## Move 1 — Current state

**30 files** under `src/` (flat; no feature folders).

```
src/
├── App.jsx
├── Dashboard.jsx
├── CheckoutModal.jsx
├── CartSummary.jsx
├── CartItem.jsx
├── cartService.js
├── ProductList.jsx
├── ProductCard.jsx
├── productsService.js
├── useProducts.js
├── OrdersList.jsx
├── OrderCard.jsx
├── ordersService.js
├── LoginForm.jsx
├── loginService.js
├── useLogin.js
├── LogoutButton.jsx
├── Navbar.jsx
├── Button.jsx
├── Modal.jsx
├── Spinner.jsx
├── ErrorMessage.jsx
├── EmptyState.jsx
├── useCart.js
├── useDebounce.js
├── formatCurrency.js
├── truncateText.js
├── apiClient.js
├── main.jsx
└── index.css
```

### Time-to-find estimate

For a new engineer looking for **cart checkout logic** (submit order, confirm checkout modal): in this flat layout they must search filenames or grep `checkout` across all of `src/`. Realistically **15–30+ minutes** on day one — there is no `cart/` or `checkout/` folder signalling ownership; `CheckoutModal.jsx` sits beside unrelated files like `OrderCard.jsx` and `loginService.js`.

---

## Move 2 — File mapping (flat → target)

| Current file | Target path |
|--------------|-------------|
| `LoginForm.jsx` | `features/auth/LoginForm.jsx` |
| `loginService.js` | `features/auth/loginService.js` |
| `useLogin.js` | `features/auth/useLogin.js` |
| `LogoutButton.jsx` | `features/auth/LogoutButton.jsx` |
| `CartItem.jsx` | `features/cart/CartItem.jsx` |
| `CartSummary.jsx` | `features/cart/CartSummary.jsx` |
| `CheckoutModal.jsx` | `features/cart/CheckoutModal.jsx` |
| `cartService.js` | `features/cart/cartService.js` |
| `useCart.js` | `features/cart/useCart.js` |
| `ProductCard.jsx` | `features/products/ProductCard.jsx` |
| `ProductList.jsx` | `features/products/ProductList.jsx` |
| `productsService.js` | `features/products/productsService.js` |
| `useProducts.js` | `features/products/useProducts.js` |
| `OrderCard.jsx` | `features/orders/OrderCard.jsx` |
| `OrdersList.jsx` | `features/orders/OrdersList.jsx` |
| `ordersService.js` | `features/orders/ordersService.js` |
| `Dashboard.jsx` | `features/orders/Dashboard.jsx` |
| `Button.jsx` | `components/Button.jsx` |
| `Modal.jsx` | `components/Modal.jsx` |
| `Spinner.jsx` | `components/Spinner.jsx` |
| `ErrorMessage.jsx` | `components/ErrorMessage.jsx` |
| `EmptyState.jsx` | `components/EmptyState.jsx` |
| `Navbar.jsx` | `components/Navbar.jsx` |
| `useDebounce.js` | `hooks/useDebounce.js` |
| `formatCurrency.js` | `utils/formatCurrency.js` |
| `truncateText.js` | `utils/truncateText.js` |
| `apiClient.js` | `services/apiClient.js` |
| `App.jsx` | `App.jsx` (root) |
| `main.jsx` | `main.jsx` (root) |
| `index.css` | `index.css` (root) |

---

## Move 3 — Shared files

Used by **more than one feature** → not placed under `features/`:

| File | Folder | Used by |
|------|--------|---------|
| `Button.jsx` | `components/` | auth, cart, products |
| `Modal.jsx` | `components/` | cart |
| `Spinner.jsx` | `components/` | auth, products, orders |
| `ErrorMessage.jsx` | `components/` | products, orders |
| `EmptyState.jsx` | `components/` | cart, orders |
| `Navbar.jsx` | `components/` | app shell (all routes) |
| `useDebounce.js` | `hooks/` | products |
| `formatCurrency.js` | `utils/` | cart, products, orders |
| `truncateText.js` | `utils/` | products |
| `apiClient.js` | `services/` | auth, cart, products, orders services |

---

## Move 4 — Target structure (plan)

```
src/
├── features/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── loginService.js
│   │   ├── useLogin.js
│   │   └── LogoutButton.jsx
│   ├── cart/
│   │   ├── CartItem.jsx
│   │   ├── CartSummary.jsx
│   │   ├── CheckoutModal.jsx
│   │   ├── cartService.js
│   │   └── useCart.js
│   ├── products/
│   │   ├── ProductCard.jsx
│   │   ├── ProductList.jsx
│   │   ├── productsService.js
│   │   └── useProducts.js
│   └── orders/
│       ├── Dashboard.jsx
│       ├── OrderCard.jsx
│       ├── OrdersList.jsx
│       └── ordersService.js
├── components/
│   ├── Button.jsx
│   ├── Modal.jsx
│   ├── Spinner.jsx
│   ├── ErrorMessage.jsx
│   ├── EmptyState.jsx
│   └── Navbar.jsx
├── hooks/
│   └── useDebounce.js
├── utils/
│   ├── formatCurrency.js
│   └── truncateText.js
├── services/
│   └── apiClient.js
├── App.jsx
├── main.jsx
└── index.css
```

---

## Move 10 — Final documentation

### Final folder tree (as-built)

```
src/
├── features/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── loginService.js
│   │   ├── useLogin.js
│   │   └── LogoutButton.jsx
│   ├── cart/
│   │   ├── CartItem.jsx
│   │   ├── CartSummary.jsx
│   │   ├── CheckoutModal.jsx
│   │   ├── cartService.js
│   │   └── useCart.js
│   ├── products/
│   │   ├── ProductCard.jsx
│   │   ├── ProductList.jsx
│   │   ├── productsService.js
│   │   └── useProducts.js
│   └── orders/
│       ├── Dashboard.jsx
│       ├── OrderCard.jsx
│       ├── OrdersList.jsx
│       └── ordersService.js
├── components/
│   ├── Button.jsx
│   ├── Modal.jsx
│   ├── Spinner.jsx
│   ├── ErrorMessage.jsx
│   ├── EmptyState.jsx
│   └── Navbar.jsx
├── hooks/
│   └── useDebounce.js
├── utils/
│   ├── formatCurrency.js
│   └── truncateText.js
├── services/
│   └── apiClient.js
├── App.jsx
├── main.jsx
└── index.css
```

### Folder rules

**`features/<name>/`** — Everything that exists for one user-facing capability (auth, cart, products, orders). If you remove the feature folder, that product area disappears. Example: `CheckoutModal.jsx` lives in `features/cart/` because checkout is cart behaviour.

**`components/`** — Presentational UI reused by two or more features, with no feature-specific business rules. Example: `Button.jsx` is used on login, cart, and product cards.

**`hooks/`** — Reusable React hooks not tied to a single feature. Example: `useDebounce.js` powers product search only today, but the hook itself is generic.

**`utils/`** — Pure functions (no React). Example: `formatCurrency.js` is shared by cart line items, product cards, and order cards.

**`services/`** — App-wide infrastructure for talking to backends. Example: `apiClient.js` is imported by every `*Service.js` under features.

**`App.jsx` / `main.jsx`** — Application shell: routing, global cart state, and bootstrap only.

### Decision tree (where does a new file go?)

1. **Is it only used inside one feature?** → `features/<feature>/` (sibling imports use `./`).
2. **Is it used by multiple features?** → Continue to step 3.
3. **Is it a React hook?** → `hooks/`.
4. **Is it a pure helper with no JSX?** → `utils/`.
5. **Is it API / HTTP plumbing?** → `services/`.
6. **Otherwise (shared UI)?** → `components/`.

### Adding a new feature (e.g. `wishlist`)

1. Create `src/features/wishlist/`.
2. Add UI (`WishlistPage.jsx`), data (`wishlistService.js`), and state (`useWishlist.js`) together in that folder.
3. Import shared pieces from `../../components/`, `../../hooks/`, `../../utils/`, `../../services/` as needed.
4. Register a route in `App.jsx` pointing at the new page component.
5. If other features need wishlist UI, extract only the reusable piece into `components/` — do not import `features/wishlist` from `features/cart`.

### Before vs after

**Before:** All 27 modules sat in a single `src/` list. Finding checkout meant guessing filenames (`CheckoutModal.jsx` next to `loginService.js`) and searching the tree.

**After:** Checkout lives at `src/features/cart/CheckoutModal.jsx` beside `cartService.js` and `CartSummary.jsx`. A new engineer opens `features/cart/` and sees the whole purchase flow in one place — typically **under 10 seconds** instead of 15–30+ minutes of hunting.

### Live deployment

_Add after deploy:_ see README **Live Deployment**.
