/**
 * Allowed browser origins for CORS + Socket.IO (credentials enabled — never use "*").
 * Always includes http://localhost:3000 for local React dev.
 * Set CORS_ORIGIN to your Vercel URL(s), comma-separated for multiple (e.g. prod + preview).
 */
const LOCAL_DEV_ORIGIN = 'http://localhost:3000';

function parseOriginsFromEnv() {
  const raw = process.env.CORS_ORIGIN;
  if (raw == null || String(raw).trim() === '') return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function buildAllowedOriginSet() {
  const set = new Set([LOCAL_DEV_ORIGIN, ...parseOriginsFromEnv()]);
  return set;
}

let cachedSet = null;
function getAllowedOriginsSet() {
  if (!cachedSet) cachedSet = buildAllowedOriginSet();
  return cachedSet;
}

/**
 * Express CORS origin callback — reflects allowed origin only when listed.
 * Requests with no Origin (same-origin navigation, curl, health probes) are allowed.
 */
function corsOriginCallback(origin, callback) {
  try {
    // Non-browser or same-origin: no Origin header
    if (!origin) {
      return callback(null, true);
    }
    const normalized = origin.replace(/\/$/, '');
    if (getAllowedOriginsSet().has(normalized)) {
      // With credentials, reflect the exact origin (never use "*")
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  } catch (e) {
    return callback(e);
  }
}

function getCorsOptions() {
  return {
    origin: corsOriginCallback,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
  };
}

function getSocketIoCorsConfig() {
  return {
    origin: corsOriginCallback,
    credentials: true,
    methods: ['GET', 'POST']
  };
}

module.exports = {
  LOCAL_DEV_ORIGIN,
  getAllowedOriginsSet,
  corsOriginCallback,
  getCorsOptions,
  getSocketIoCorsConfig
};
