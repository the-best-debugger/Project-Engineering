# Screenshots for PR

## Before (broken)

| File | Capture |
|------|---------|
| `before-list.png` | Account B dashboard — shows Account A's private event |
| `before-detail.png` | Account B views A's event — full details visible |
| `before-rsvp.png` | Account B RSVPs to uninvited event — **200** success |
| `before-delete.png` | Account B deletes A's event — **200** success |
| `before-buttons.png` | RSVP + Delete buttons visible for uninvited user |

## After (fixed)

| File | Capture |
|------|---------|
| `after-list.png` | Account B — only invited/own events |
| `after-detail-403.png` | `GET /events/:id` — **403** for uninvited user |
| `after-rsvp-403.png` | `POST .../rsvp` — **403** for uninvited user |
| `after-delete-403.png` | `DELETE .../id` — **403** for non-creator |
| `after-buttons.png` | Buttons hidden or page unreachable for uninvited user |
