import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { db } from './db.js';
import { HttpError, forbidden, parseCookies, setCookie, unauthorized } from './http.js';

const scrypt = promisify(crypto.scrypt);
const CUSTOMER_COOKIE = 'pp_session';
const ADMIN_COOKIE = 'pp_admin';
const CUSTOMER_TTL = 60 * 60 * 24 * 30;
const ADMIN_TTL = 60 * 60 * 12;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new HttpError(500, 'Server is not configured', 'CONFIG');
  return new TextEncoder().encode(s);
}

// ---------- passwords (scrypt, per-user salt) ----------
const N = 16384;
export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pw, salt, 64, { N, r: 8, p: 1 });
  return `scrypt$${N}$${salt.toString('base64')}$${key.toString('base64')}`;
}

let dummyHash;
export async function verifyPassword(pw, stored) {
  if (!stored) {
    // keep timing similar when the account is unknown
    dummyHash ||= await hashPassword('dummy-password-for-timing');
    await verifyPassword(pw, dummyHash);
    return false;
  }
  const [alg, n, salt, hash] = stored.split('$');
  if (alg !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scrypt(pw, Buffer.from(salt, 'base64'), expected.length, { N: Number(n), r: 8, p: 1 });
  return crypto.timingSafeEqual(key, expected);
}

// ---------- sessions ----------
async function sign(payload, ttl) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${ttl}s`).sign(secret());
}
async function read(token) {
  try {
    return (await jwtVerify(token, secret(), { algorithms: ['HS256'] })).payload;
  } catch {
    return null;
  }
}

export async function startCustomerSession(res, customerId) {
  setCookie(res, CUSTOMER_COOKIE, await sign({ sub: customerId, t: 'c' }, CUSTOMER_TTL), { maxAge: CUSTOMER_TTL });
}
export async function startAdminSession(res, email) {
  setCookie(res, ADMIN_COOKIE, await sign({ sub: email, t: 'a' }, ADMIN_TTL), { maxAge: ADMIN_TTL });
}
export function endSessions(res) {
  setCookie(res, CUSTOMER_COOKIE, '', { maxAge: 0 });
  setCookie(res, ADMIN_COOKIE, '', { maxAge: 0 });
}

export async function getCustomer(req) {
  const tok = parseCookies(req)[CUSTOMER_COOKIE];
  const p = tok && (await read(tok));
  if (!p || p.t !== 'c') return null;
  return db.customer.findUnique({ where: { id: p.sub }, include: { credential: { select: { id: true } } } });
}

export async function requireCustomer(req) {
  const c = await getCustomer(req);
  if (!c) throw unauthorized();
  return c;
}

export function superAdminEmail() {
  return (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
}

// Admin = separate cookie, issued only after a verified Google email equals SUPER_ADMIN_EMAIL.
// Re-checked against the env on every request.
export async function getAdminEmail(req) {
  const tok = parseCookies(req)[ADMIN_COOKIE];
  const p = tok && (await read(tok));
  const want = superAdminEmail();
  if (!p || p.t !== 'a' || !want || String(p.sub).toLowerCase() !== want) return null;
  return want;
}

export async function requireAdmin(req) {
  const e = await getAdminEmail(req);
  if (!e) throw forbidden('Super Admin access required');
  return e;
}

// ---------- Google ID token ----------
let jwks;
export async function verifyGoogleCredential(credential, keyResolver) {
  const aud = process.env.GOOGLE_CLIENT_ID;
  if (!aud) throw new HttpError(503, 'Google sign-in is not configured', 'CONFIG');
  jwks ||= createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
  let payload;
  try {
    ({ payload } = await jwtVerify(credential, keyResolver || jwks, {
      audience: aud,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    }));
  } catch {
    throw unauthorized('Google sign-in could not be verified', 'GOOGLE_INVALID');
  }
  if (payload.email_verified !== true || typeof payload.email !== 'string') {
    throw unauthorized('Google email is not verified', 'GOOGLE_INVALID');
  }
  return { email: payload.email.toLowerCase(), name: payload.name || '' };
}
