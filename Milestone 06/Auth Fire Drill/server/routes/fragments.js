const express = require('express');
const router = express.Router();
const { fragments, users } = require('../data/store');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const csrfProtect = require('../middleware/csrf');

router.get('/', (req, res) => {
  res.json(fragments);
});

// Create — Contributor, Curator, Admin
router.post(
  '/',
  auth,
  csrfProtect,
  roleCheck(['contributor', 'curator', 'admin']),
  (req, res) => {
    const { content, parentId } = req.body;
    const newFrag = {
      id: Date.now().toString(),
      content,
      parentId,
      userId: req.user.userId,
      author: users.find((u) => u.id === req.user.userId)?.email,
      status: req.user.role === 'contributor' ? 'pending' : 'published',
      createdAt: new Date(),
    };
    fragments.push(newFrag);
    res.status(201).json(newFrag);
  }
);

// Edit — Contributor (own only), Curator, Admin
router.put(
  '/:id',
  auth,
  csrfProtect,
  roleCheck(['contributor', 'curator', 'admin']),
  (req, res) => {
    const frag = fragments.find((f) => f.id === req.params.id);
    if (!frag) return res.status(404).json({ error: 'Fragment not found' });

    const isOwner = frag.userId === req.user.userId;
    const isPrivileged = ['curator', 'admin'].includes(req.user.role);

    if (req.user.role === 'contributor' && !isOwner) {
      return res.status(403).json({ error: 'You can only edit your own fragments' });
    }

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    frag.content = req.body.content;
    res.json(frag);
  }
);

// Approve — Curator, Admin
router.post(
  '/:id/approve',
  auth,
  csrfProtect,
  roleCheck(['curator', 'admin']),
  (req, res) => {
    const frag = fragments.find((f) => f.id === req.params.id);
    if (!frag) return res.status(404).json({ error: 'Fragment not found' });
    frag.status = 'published';
    res.json(frag);
  }
);

// Delete — Admin only
router.delete(
  '/:id',
  auth,
  csrfProtect,
  roleCheck(['admin']),
  (req, res) => {
    const index = fragments.findIndex((f) => f.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    fragments.splice(index, 1);
    res.json({ message: 'Deleted' });
  }
);

module.exports = router;
