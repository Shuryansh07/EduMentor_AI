import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

/** Require a valid access token; attaches the live user document to req.user. */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or disabled');

  req.user = user;
  next();
});

/** Optional auth: attaches req.user when a valid token is present, else continues. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = await User.findById(payload.sub);
    } catch {
      /* ignore — treat as anonymous */
    }
  }
  next();
});
