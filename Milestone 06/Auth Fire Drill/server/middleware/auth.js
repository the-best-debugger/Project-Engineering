const { verifyToken } = require('../auth/jwt');
const { blacklist } = require('../data/store');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  if (blacklist.includes(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired' });
    }
    return res.status(401).json({ error: 'Auth failed' });
  }
};

module.exports = auth;
