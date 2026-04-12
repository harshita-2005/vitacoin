const COOKIE_NAME = process.env.JWT_COOKIE_NAME || 'vitacoin_token';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Cross-site (Vercel → Render): SameSite=None + Secure required.
 * Local dev (localhost:3000 → localhost:5000): schemeful same-site; Lax + non-Secure works for HTTP.
 */
function getCookieBaseOptions() {
  const prod = isProduction();
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getCookieBaseOptions());
}

function clearAuthCookie(res) {
  const opts = getCookieBaseOptions();
  res.clearCookie(COOKIE_NAME, {
    path: opts.path,
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite
  });
}

function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    acc[key] = decodeURIComponent(val);
    return acc;
  }, {});
}

function getTokenFromCookieHeader(cookieHeader) {
  const cookies = parseCookies(cookieHeader);
  return cookies[COOKIE_NAME] || null;
}

module.exports = {
  COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
  getTokenFromCookieHeader,
  parseCookies,
  isProduction
};
