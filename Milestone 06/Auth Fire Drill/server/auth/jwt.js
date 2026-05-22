const jwt = require('jsonwebtoken');

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

const signToken = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};

module.exports = { signToken, verifyToken, getSecret };
