const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { users, blacklist } = require('../data/store');
const { signToken } = require('../auth/jwt');
const auth = require('../middleware/auth');
const csrfProtect = require('../middleware/csrf');

const issueCsrfCookie = (res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('csrfToken', csrfToken, {
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  return csrfToken;
};

router.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: 'User exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    role: role || 'reader',
  };
  users.push(user);

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const csrfToken = issueCsrfCookie(res);

  res.json({
    token,
    csrfToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const csrfToken = issueCsrfCookie(res);

  res.json({
    token,
    csrfToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

router.post('/logout', auth, csrfProtect, (req, res) => {
  if (req.token && !blacklist.includes(req.token)) {
    blacklist.push(req.token);
  }
  res.clearCookie('csrfToken');
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
