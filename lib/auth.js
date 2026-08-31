const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SECRET = process.env.AUTH_SECRET || 'ganti-nilai-ini-di-environment-variables';
const COOKIE_NAME = 'bn_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 hari

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payload) {
  const data = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return data + '.' + sig;
}

function verify(token) {
  if (!token || token.indexOf('.') === -1) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch (e) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  });
  return out;
}

function setSessionCookie(res, guruId) {
  const token = sign({ guruId: guruId, iat: Date.now() });
  res.setHeader(
    'Set-Cookie',
    COOKIE_NAME + '=' + token + '; HttpOnly; Path=/; Max-Age=' + MAX_AGE_SECONDS + '; SameSite=Lax'
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', COOKIE_NAME + '=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
}

function getGuruIdFromReq(req) {
  const cookies = parseCookies(req);
  const payload = verify(cookies[COOKIE_NAME]);
  return payload ? payload.guruId : null;
}

module.exports = {
  bcrypt,
  setSessionCookie,
  clearSessionCookie,
  getGuruIdFromReq,
};
