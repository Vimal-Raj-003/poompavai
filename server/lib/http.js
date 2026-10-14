export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const badRequest = (m, code) => new HttpError(400, m, code);
export const unauthorized = (m = 'Please sign in', code = 'UNAUTHENTICATED') => new HttpError(401, m, code);
export const forbidden = (m = 'Forbidden', code = 'FORBIDDEN') => new HttpError(403, m, code);
export const notFound = (m = 'Not found') => new HttpError(404, m, 'NOT_FOUND');
export const conflict = (m, code) => new HttpError(409, m, code);

const MAX_BODY = 256 * 1024;

export async function readRaw(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw new HttpError(413, 'Request too large');
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

export function parseJson(raw) {
  if (!raw.length) return {};
  try {
    const v = JSON.parse(raw.toString('utf8'));
    return v && typeof v === 'object' ? v : {};
  } catch {
    throw badRequest('Invalid JSON');
  }
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function setCookie(res, name, value, { maxAge, path = '/' } = {}) {
  const secure = process.env.VERCEL_ENV ? '; Secure' : '';
  const age = maxAge === undefined ? '' : `; Max-Age=${maxAge}`;
  const c = `${name}=${encodeURIComponent(value)}; Path=${path}; HttpOnly; SameSite=Lax${age}${secure}`;
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, c) : c);
}

export function clientIp(req) {
  const h = req.headers;
  return (
    (h['x-vercel-forwarded-for'] || h['x-real-ip'] || (h['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || 'unknown')
      .toString()
      .trim()
  );
}
