import rateLimit from 'express-rate-limit'

export const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // conservative initial limit (1 request per user per hour)
  keyGenerator: (req) => (req.user && req.user.id) ? req.user.id.toString() : req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      message: 'AI request limit reached. Try again in 60 minutes.',
      statusCode: 429,
      retryAfter: 3600
    })
  }
})
