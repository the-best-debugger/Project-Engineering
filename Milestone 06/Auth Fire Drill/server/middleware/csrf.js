const csrfProtect = (req, res, next) => {
  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies?.csrfToken;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ error: 'CSRF token invalid or missing' });
  }

  next();
};

module.exports = csrfProtect;
