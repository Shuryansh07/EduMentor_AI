import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { REFRESH_COOKIE, refreshCookieOptions, verifyRefreshToken } from '../utils/jwt.js';
import * as authService from '../services/auth.service.js';

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const { user, accessToken, refreshToken } = await authService.registerUser({
    name,
    email,
    password,
    role,
  });
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ success: true, user, accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser({ email, password });
  setRefreshCookie(res, refreshToken);
  res.json({ success: true, user, accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const { user, accessToken, refreshToken } = await authService.rotateTokens(payload);
  setRefreshCookie(res, refreshToken);
  res.json({ success: true, user, accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  // Bump tokenVersion if we know who it is, then clear the cookie.
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await authService.revokeSessions(payload.sub);
    } catch {
      /* ignore */
    }
  }
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.json({ success: true, message: 'Logged out' });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  const { user, accessToken, refreshToken } = await authService.googleAuth(credential);
  setRefreshCookie(res, refreshToken);
  res.json({ success: true, user, accessToken });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// OTP flow: email a 6-digit code.
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordResetOtp(req.body.email);
  res.json({ success: true, message: 'If that email exists, a reset code has been sent.' });
});

// OTP flow: verify the code + set a new password (auto signs the user in).
export const resetPasswordOtp = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.resetPasswordWithOtp({
    email,
    otp,
    password,
  });
  setRefreshCookie(res, refreshToken);
  res.json({ success: true, user, accessToken, message: 'Password updated' });
});

// Legacy link flow (kept for completeness): reset via emailed token URL.
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const { user, accessToken, refreshToken } = await authService.resetPassword({ token, password });
  setRefreshCookie(res, refreshToken);
  res.json({ success: true, user, accessToken, message: 'Password updated' });
});
