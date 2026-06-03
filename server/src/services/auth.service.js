import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import sendEmail from '../utils/sendEmail.js';
import env from '../config/env.js';

function issueTokens(user) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

let googleClient = null;
const getGoogleClient = () => {
  if (!googleClient) googleClient = new OAuth2Client(env.google.clientId);
  return googleClient;
};

export const isGoogleConfigured = () => Boolean(env.google.clientId);

/**
 * Verify a Google ID token (credential) and sign the user in, creating the
 * account on first login. Links Google to an existing local account by email.
 */
export async function googleAuth(credential) {
  if (!env.google.clientId) {
    throw ApiError.badRequest('Google sign-in is not configured on the server');
  }
  if (!credential) throw ApiError.badRequest('Missing Google credential');

  let payload;
  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: env.google.clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Invalid Google token');
  }

  const { sub, email, name, picture, email_verified: emailVerified } = payload;
  if (!email || !emailVerified) throw ApiError.badRequest('Google email is not verified');

  let user = await User.findOne({ $or: [{ googleId: sub }, { email: email.toLowerCase() }] });

  if (!user) {
    user = await User.create({
      googleId: sub,
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      role: 'student',
      authProvider: 'google',
      avatar: { url: picture || '', publicId: '' },
    });
  } else if (!user.googleId) {
    // Link Google to an existing local account.
    user.googleId = sub;
    if (!user.avatar?.url && picture) user.avatar = { url: picture, publicId: '' };
    await user.save({ validateBeforeSave: false });
  }

  if (!user.isActive) throw ApiError.unauthorized('Account is disabled');

  return { user, ...issueTokens(user) };
}

export async function registerUser({ name, email, password, role }) {
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  // Only allow self-registration as student or teacher; admins are seeded/promoted.
  const safeRole = role === 'teacher' ? 'teacher' : 'student';
  const user = await User.create({ name, email, password, role: safeRole });
  return { user, ...issueTokens(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  return { user, ...issueTokens(user) };
}

export async function rotateTokens(refreshPayload) {
  const user = await User.findById(refreshPayload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Session expired');
  // tokenVersion mismatch ⇒ the session was revoked (logout / password change).
  if (user.tokenVersion !== refreshPayload.tv) throw ApiError.unauthorized('Session revoked');
  return { user, ...issueTokens(user) };
}

/** Invalidate all refresh tokens for a user. */
export async function revokeSessions(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  // Always respond success to avoid email enumeration.
  if (!user) return;

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrls[0]}/reset-password/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your EduMentor AI password',
    text: `Reset your password (valid 30 min): ${resetUrl}`,
    html: `<p>You requested a password reset.</p>
           <p><a href="${resetUrl}">Click here to reset your password</a> (valid for 30 minutes).</p>
           <p>If you didn't request this, you can ignore this email.</p>`,
  });
}

// ── OTP-based reset ────────────────────────────────────────────────────────
export async function requestPasswordResetOtp(email) {
  const user = await User.findOne({ email });
  // Respond success regardless, to avoid email enumeration.
  if (!user) return;

  const otp = user.createResetOtp();
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    to: user.email,
    subject: 'Your EduMentor AI password reset code',
    text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2049f0">EduMentor AI</h2>
        <p>Use this code to reset your password. It expires in <b>10 minutes</b>.</p>
        <p style="font-size:32px;font-weight:800;letter-spacing:8px;background:#eef4ff;
                  color:#1a39c4;padding:16px;text-align:center;border-radius:12px">${otp}</p>
        <p style="color:#64748b;font-size:13px">If you didn't request this, you can ignore this email.</p>
      </div>`,
  });
}

export async function resetPasswordWithOtp({ email, otp, password }) {
  const user = await User.findOne({ email }).select(
    '+password +resetOtp +resetOtpExpires +resetOtpAttempts'
  );
  if (!user || !user.resetOtp || !user.resetOtpExpires) {
    throw ApiError.badRequest('No active reset request — please request a new code');
  }
  if (user.resetOtpExpires.getTime() < Date.now()) {
    throw ApiError.badRequest('Code expired — please request a new one');
  }
  if (user.resetOtpAttempts >= 5) {
    throw ApiError.badRequest('Too many incorrect attempts — please request a new code');
  }

  const hashed = crypto.createHash('sha256').update(String(otp)).digest('hex');
  if (hashed !== user.resetOtp) {
    user.resetOtpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw ApiError.badRequest('Invalid code');
  }

  user.password = password;
  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
  user.tokenVersion += 1; // sign out other sessions
  await user.save();

  return { user, ...issueTokens(user) };
}

export async function resetPassword({ token, password }) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password');

  if (!user) throw ApiError.badRequest('Token is invalid or has expired');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.tokenVersion += 1; // log out other sessions
  await user.save();

  return { user, ...issueTokens(user) };
}
