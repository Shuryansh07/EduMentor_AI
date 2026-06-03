/* Tiny leveled logger so we don't pull in a heavy dependency. */
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = process.env.NODE_ENV === 'production' ? levels.info : levels.debug;

function ts() {
  // Avoids Date in hot paths only; fine for logs.
  return new Date().toISOString();
}

function log(level, ...args) {
  if (levels[level] > current) return;
  const tag = level.toUpperCase().padEnd(5);
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](`${ts()} ${tag}`, ...args);
}

const logger = {
  error: (...a) => log('error', ...a),
  warn: (...a) => log('warn', ...a),
  info: (...a) => log('info', ...a),
  debug: (...a) => log('debug', ...a),
};

export default logger;
