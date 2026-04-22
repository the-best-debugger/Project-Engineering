const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many booking attempts. Please wait a minute before trying again.'
  }
});

module.exports = { bookingLimiter };
