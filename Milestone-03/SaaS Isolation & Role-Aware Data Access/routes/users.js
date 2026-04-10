const express = require('express');
const router = express.Router();
const db = require('../db');
const { normalizeRole, sanitizeUser, sanitizeBillingForAdmin } = require('../lib/responsePolicy');

router.get('/', async (req, res) => {
  try {
    const { tenantId, actor } = req.corpflow;
    const viewerRole = normalizeRole(actor.role);

    let rows;
    if (viewerRole === 'employee') {
      const self = await db.query(
        `SELECT id, tenant_id, full_name, email, password_hash, role, salary
         FROM users
         WHERE id = $1 AND tenant_id = $2`,
        [actor.id, tenantId]
      );
      rows = self.rows;
    } else {
      const result = await db.query(
        `SELECT id, tenant_id, full_name, email, password_hash, role, salary
         FROM users
         WHERE tenant_id = $1
         ORDER BY id`,
        [tenantId]
      );
      rows = result.rows;
    }

    const payload = rows
      .map((row) => sanitizeUser(row, viewerRole, row.id === actor.id))
      .filter(Boolean);

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// Billing details for a user (Admin only, same tenant)
router.get('/:id/billing', async (req, res) => {
  try {
    const { tenantId, actor } = req.corpflow;
    const viewerRole = normalizeRole(actor.role);
    if (viewerRole !== 'admin') {
      return res.status(403).json({ error: 'Billing is restricted to tenant admins.' });
    }

    const targetId = parseInt(req.params.id, 10);
    if (!Number.isInteger(targetId)) {
      return res.status(400).json({ error: 'Invalid user id.' });
    }

    const { rows } = await db.query(
      `SELECT bd.id, bd.tenant_id, bd.user_id, bd.card_holder_name, bd.card_last4, bd.expiry_date, bd.billing_address
       FROM billing_details bd
       INNER JOIN users u ON u.id = bd.user_id AND u.tenant_id = bd.tenant_id
       WHERE bd.tenant_id = $1 AND bd.user_id = $2`,
      [tenantId, targetId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Billing details not found for this user.' });
    }

    res.json(sanitizeBillingForAdmin(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve billing details.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { tenantId, actor } = req.corpflow;
    const viewerRole = normalizeRole(actor.role);
    const targetId = parseInt(req.params.id, 10);

    if (!Number.isInteger(targetId)) {
      return res.status(400).json({ error: 'Invalid user id.' });
    }

    if (viewerRole === 'employee' && targetId !== actor.id) {
      return res.status(403).json({ error: 'You can only view your own profile.' });
    }

    const { rows } = await db.query(
      `SELECT id, tenant_id, full_name, email, password_hash, role, salary
       FROM users
       WHERE id = $1 AND tenant_id = $2`,
      [targetId, tenantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const safe = sanitizeUser(rows[0], viewerRole, targetId === actor.id);
    if (!safe) {
      return res.status(403).json({ error: 'Not allowed to view this user.' });
    }

    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find user.' });
  }
});

module.exports = router;
