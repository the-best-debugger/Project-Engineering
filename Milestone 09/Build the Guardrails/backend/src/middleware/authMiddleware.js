import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')

  if (!token) {
    return res.status(401).json({ error: 'unauthenticated', message: 'Missing Authorization header' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.user = { id: decoded.userId || decoded.id || decoded.sub || decoded.user || 'unknown' }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token', message: 'Invalid or expired token' })
  }
}
