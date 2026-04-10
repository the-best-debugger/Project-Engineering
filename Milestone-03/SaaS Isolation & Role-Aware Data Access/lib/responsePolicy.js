/**
 * Central place to map DB rows to API-safe objects by role.
 * Roles in DB: admin, manager, employee (employee = "User" in AUDIT.md).
 */

function normalizeRole(role) {
  const r = String(role || '').toLowerCase();
  if (r === 'admin' || r === 'manager' || r === 'employee') return r;
  return 'employee';
}

/** Never send password material to clients. */
function stripSecrets(userRow) {
  if (!userRow) return null;
  const { password_hash: _p, ...rest } = userRow;
  return rest;
}

/**
 * User object for JSON responses.
 * @param {'admin'|'manager'|'employee'} viewerRole - normalized role of requesting user
 * @param {boolean} isSelf - target row is the actor
 */
function sanitizeUser(userRow, viewerRole, isSelf) {
  const base = stripSecrets(userRow);
  if (!base) return null;

  if (viewerRole === 'admin') {
    return base;
  }

  if (viewerRole === 'manager') {
    const { salary: _s, ...withoutSalary } = base;
    return withoutSalary;
  }

  // employee ("User"): only own non-payroll profile fields
  if (!isSelf) {
    return null;
  }
  const { salary: _s, ...withoutSalary } = base;
  return withoutSalary;
}

/**
 * Project payload: hide budget from employees.
 * @param {'admin'|'manager'|'employee'} viewerRole
 */
function sanitizeProject(projectRow, viewerRole) {
  if (!projectRow) return null;
  if (viewerRole === 'employee') {
    const { budget: _b, ...rest } = projectRow;
    return rest;
  }
  return { ...projectRow };
}

/** Billing: Admin only — full row without joining secrets. */
function sanitizeBillingForAdmin(billingRow) {
  if (!billingRow) return null;
  return { ...billingRow };
}

module.exports = {
  normalizeRole,
  sanitizeUser,
  sanitizeProject,
  sanitizeBillingForAdmin,
};
