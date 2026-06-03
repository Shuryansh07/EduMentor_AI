import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Access token: short-lived, sent in the Authorization header.
 * Refresh token: long-lived, stored in an httpOnly cookie, carries `tokenVersion`
 * so a logout / password change can invalidate every outstanding session.
 */
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tv: user.tokenVersion },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpires }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

export const REFRESH_COOKIE = 'em_refresh';

export function refreshCookieOptions() {
  const days = env.jwt.refreshCookieDays;
  return {
    httpOnly: true,
    secure: env.isProd, // requires HTTPS in production
    sameSite: env.isProd ? 'none' : 'lax', // 'none' so the Vercel SPA can send it cross-site
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}
