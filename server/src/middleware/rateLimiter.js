import rateLimit from 'express-rate-limit';

const message = (msg) => ({ success: false, message: msg });

/** Generous global limiter applied to the whole API. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many requests, please slow down.'),
});

/** Strict limiter for auth endpoints to blunt brute-force attempts. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('Too many authentication attempts, try again later.'),
});

/** AI endpoints are expensive — cap per window. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('AI rate limit reached, please wait a moment.'),
});
