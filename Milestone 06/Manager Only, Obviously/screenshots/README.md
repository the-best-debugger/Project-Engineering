# Verification Screenshots

Capture terminal or API client output for each scenario:

| File | Scenario |
|------|----------|
| `01-user-approve.png` | User → `PUT /api/expenses/:id/approve` → **403** |
| `02-user-delete.png` | User → `DELETE /api/expenses/:id` → **403** |
| `03-user-role.png` | User → `PUT /api/users/:id/role` → **403** |
| `04-user-edit-other.png` | User → `PUT /api/expenses/:otherId` (not owner) → **403** |
| `05-manager-approve.png` | Manager → `PUT /api/expenses/:id/approve` → **200** |
| `06-manager-role.png` | Manager → `PUT /api/users/:id/role` → **403** |
| `07-admin-delete.png` | Admin → `DELETE /api/expenses/:id` → **200** |
| `08-admin-role.png` | Admin → `PUT /api/users/:id/role` → **200** |

Embed all eight in the PR description.
