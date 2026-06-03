import ApiError from '../utils/ApiError.js';

/** Role-based authorization. Usage: authorize('teacher', 'admin'). */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
  }
  next();
};
