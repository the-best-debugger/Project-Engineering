const express = require('express');
const router = express.Router();
const db = require('../db');
const { normalizeRole, sanitizeProject } = require('../lib/responsePolicy');

router.get('/', async (req, res) => {
  try {
    const { tenantId, actor } = req.corpflow;
    const viewerRole = normalizeRole(actor.role);

    let rows;
    if (viewerRole === 'employee') {
      const result = await db.query(
        `SELECT p.id, p.tenant_id, p.name, p.description, p.status, p.budget
         FROM projects p
         INNER JOIN project_assignments pa
           ON pa.project_id = p.id AND pa.tenant_id = p.tenant_id
         WHERE p.tenant_id = $1 AND pa.user_id = $2
         ORDER BY p.id`,
        [tenantId, actor.id]
      );
      rows = result.rows;
    } else {
      const result = await db.query(
        `SELECT id, tenant_id, name, description, status, budget
         FROM projects
         WHERE tenant_id = $1
         ORDER BY id`,
        [tenantId]
      );
      rows = result.rows;
    }

    res.json(rows.map((row) => sanitizeProject(row, viewerRole)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find projects.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { tenantId, actor } = req.corpflow;
    const viewerRole = normalizeRole(actor.role);
    const projectId = parseInt(req.params.id, 10);

    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ error: 'Invalid project id.' });
    }

    if (viewerRole === 'employee') {
      const result = await db.query(
        `SELECT p.id, p.tenant_id, p.name, p.description, p.status, p.budget
         FROM projects p
         INNER JOIN project_assignments pa
           ON pa.project_id = p.id AND pa.tenant_id = p.tenant_id
         WHERE p.tenant_id = $1 AND p.id = $2 AND pa.user_id = $3`,
        [tenantId, projectId, actor.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      return res.json(sanitizeProject(result.rows[0], viewerRole));
    }

    const { rows } = await db.query(
      `SELECT id, tenant_id, name, description, status, budget
       FROM projects
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, projectId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json(sanitizeProject(rows[0], viewerRole));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve project info.' });
  }
});

module.exports = router;
