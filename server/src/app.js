import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { globalLimiter } from './middleware/rateLimiter.js';

const app = express();

// Behind Render/Vercel proxies — needed for secure cookies + rate-limit IPs.
app.set('trust proxy', 1);

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS (allow-list + credentials for the refresh cookie) ─────────────────
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no origin) and any whitelisted client URL.
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// ── Body / cookie parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ── Sanitisation against NoSQL injection & XSS, param pollution ────────────
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ── Misc ───────────────────────────────────────────────────────────────────
app.use(compression());
if (!env.isProd) app.use(morgan('dev'));

// ── Rate limiting (global) + API routes ────────────────────────────────────
app.use('/api', globalLimiter, routes);

app.get('/', (req, res) => res.json({ name: 'EduMentor AI API', version: '1.0.0' }));

// ── 404 + error handling (must be last) ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
