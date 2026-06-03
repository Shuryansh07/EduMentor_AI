import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, validated environment configuration.
 * Importing this module guarantees required vars exist (in production).
 */
const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),

  // CORS allow-list (comma separated). Falls back to localhost dev origin.
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGODB_URI,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
    refreshCookieDays: parseInt(process.env.REFRESH_COOKIE_DAYS || '7', 10),
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'edumentor',
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'EduMentor AI <no-reply@edumentor.ai>',
  },
};

export function assertEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    // In production we hard-fail; in dev we warn so people can boot quickly.
    const msg = `Missing required env vars: ${missing.join(', ')}`;
    if (env.isProd) throw new Error(msg);
    // eslint-disable-next-line no-console
    console.warn(`⚠️  ${msg} (continuing in development)`);
  }
}

export default env;
