const db = require('../db');

/**
 * Requires X-Tenant-Id and X-User-Id headers, loads the actor from DB, and verifies tenant match.
 * Attaches req.corpflow = { tenantId, actor }.
 */
async function requireActor(req, res, next) {
  const tenantId = parseInt(req.get('X-Tenant-Id') || req.get('x-tenant-id'), 10);
  const userId = parseInt(req.get('X-User-Id') || req.get('x-user-id'), 10);

  if (!Number.isInteger(tenantId) || tenantId <= 0 || !Number.isInteger(userId) || userId <= 0) {
    return res.status(401).json({
      error: 'Missing or invalid context headers.',
      hint: 'Send X-Tenant-Id and X-User-Id (integers) on every /users and /projects request.',
    });
  }

  try {
    const { rows } = await db.query(
      `SELECT id, tenant_id, full_name, email, password_hash, role, salary
       FROM users
       WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Actor not found for this tenant.' });
    }

    req.corpflow = { tenantId, actor: rows[0] };
    return next();
  } catch (err) {
    console.error(err);
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      error: 'Failed to resolve request context.',
      ...(isDev && err && err.message
        ? {
            details: err.message,
            hint:
              'Check DATABASE_URL in .env, run the API from the project folder (so dotenv loads), ensure PostgreSQL is running, and run schema.sql (npm run seed).',
          }
        : {}),
    });
  }
}

module.exports = requireActor;
