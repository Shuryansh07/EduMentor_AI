import app from './app.js';
import env, { assertEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import logger from './config/logger.js';

assertEnv();

let server;

async function start() {
  try {
    await connectDB();
    server = app.listen(env.port, () => {
      logger.info(`🚀 EduMentor AI API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// ── Graceful shutdown & crash safety ────────────────────────────────────────
function shutdown(signal) {
  logger.warn(`${signal} received — shutting down`);
  if (server) server.close(() => process.exit(0));
  else process.exit(0);
}
['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

start();
