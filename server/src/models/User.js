import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const ROLES = ['student', 'teacher', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Password is required for local accounts only; Google accounts have none.
    password: {
      type: String,
      select: false,
      minlength: 8,
      required: function requiredPassword() {
        return !this.googleId;
      },
    },
    role: { type: String, enum: ROLES, default: 'student', index: true },

    // OAuth
    googleId: { type: String, index: true, sparse: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    bio: { type: String, default: '', maxlength: 280 },

    // Self-reported study focus — powers tutor/quiz personalization.
    subjects: { type: [String], default: [] },

    isActive: { type: Boolean, default: true },

    // Bumped on logout / password change to invalidate all refresh tokens.
    tokenVersion: { type: Number, default: 0 },

    // Lightweight rollups so the dashboard avoids heavy aggregation on every load.
    stats: {
      studyMinutes: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      lastActiveOn: { type: Date, default: null },
    },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    // OTP-based password reset
    resetOtp: { type: String, select: false }, // sha256 hash of the 6-digit code
    resetOtpExpires: { type: Date, select: false },
    resetOtpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

// ── Hooks ────────────────────────────────────────────────────────────────
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Methods ──────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 min
  return raw; // emailed to user; only the hash is stored
};

// Generate a 6-digit OTP for password reset; only its hash is persisted.
userSchema.methods.createResetOtp = function createResetOtp() {
  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  this.resetOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetOtpExpires = Date.now() + 1000 * 60 * 10; // 10 min
  this.resetOtpAttempts = 0;
  return otp;
};

// Never leak sensitive fields in JSON responses.
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.tokenVersion;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
