## Orders Dashboard UX State Improvements

### What the original implementation did

The dashboard correctly fetched order data, but the table body still rendered a placeholder panel with a raw JSON dump (`loading`, `error`, and `ordersCount`) instead of user-facing UI states. This caused a poor experience for operations users because they could not easily understand whether data was loading, missing, or failed.

### What was missing or broken

- Loading state was not represented as a real table skeleton matching final layout.
- Success state did not render the required production order columns and had no priority flag.
- Empty state had unfinished placeholder copy with no contextual handling for filtered results.
- Error state used a generic heading and did not surface specific recovery guidance by error type.
- Summary metrics were incomplete for the requested UX requirements (missing total orders + status breakdown).

### What I implemented

#### 1) Loading state (`LoadingState`)
- Added a dedicated component that renders multiple animated skeleton rows shaped like the real table.
- Keeps table structure stable and prevents jarring layout shifts while data is loading.

#### 2) Success state (`SuccessState`)
- Added a dedicated component that maps and renders rows through `OrderRow`.
- Updated visible columns to include required fields:
  - Order ID
  - Customer Name
  - Order Date
  - Total Amount
  - Status
  - Priority Flag
- Added derived `priority` logic to each order during normalization (`High` for high-value or attention-needed orders).

#### 3) Empty state (`EmptyState`)
- Added a dedicated component with icon, heading, explanatory text, and CTA.
- Implemented two scenarios:
  - **No orders exist**: onboarding-style message + create-order CTA.
  - **No orders match active filter**: filter-aware message + clear-filter CTA.
- Added status filtering control so filtered empty behavior is meaningful in real usage.

#### 4) Error state (`ErrorState`)
- Added a dedicated component with improved visual hierarchy and retry action.
- Implemented specific error copy strategy:
  - 503 service unavailable message with actionable wait/retry guidance.
  - Network and timeout-specific guidance.
  - Fallback to actual API error text (never generic “Something went wrong”).
- Retry button reuses the existing `loadOrders` function.

### Summary metrics and dashboard behavior improvements

- Metrics now include:
  - Total orders
  - Total value
  - Needs attention count
- Added a separate status breakdown chip row (e.g., Delivered: X, Pending: Y).
- Kept state transitions smooth by preserving table shell and applying subtle content transition styling.

### Why this improves user experience

The Orders Dashboard now always communicates what is happening:
- users immediately see progress while waiting,
- can scan real data quickly in a structured table,
- understand why no data appears and what action to take,
- and can recover from failures using clear, actionable error messages.

This prevents confusion, reduces support friction, and makes the page production-ready for operations, warehouse, and customer support workflows.
