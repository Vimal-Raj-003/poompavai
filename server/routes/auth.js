import crypto from 'node:crypto';
import { db } from '../lib/db.js';
import {
  endSessions, getAdminEmail, getCustomer, hashPassword, requireCustomer, startAdminSession,
  startCustomerSession, superAdminEmail, verifyGoogleCredential, verifyPassword,
} from '../lib/auth.js';
import { badRequest, conflict, forbidden, unauthorized } from '../lib/http.js';
import { rateLimit } from '../lib/ratelimit.js';
import { age, email as vEmail, lang as vLang, mobile as vMobile, normalizeMobile, password as vPassword, str } from '../lib/validate.js';
import { codeEmail, sendEmail } from '../lib/email.js';
import { customerOut } from '../lib/serialize.js';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const codeHash = (email, code) => crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(`${email}:${code}`).digest('hex');

async function sendCode(email, purpose, language, customerId = null) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await db.emailVerificationCode.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: new Date() } });
  await db.emailVerificationCode.create({ data: { email, purpose, customerId, codeHash: codeHash(email, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
  const m = codeEmail(code, language);
  await sendEmail({ to: email, ...m });
}

// Returns the matching code row, consuming it, or throws.
async function checkCode(email, code, purpose) {
  if (!/^\d{6}$/.test(String(code || ''))) throw badRequest('Enter the 6-digit code', 'CODE_INVALID');
  const row = await db.emailVerificationCode.findFirst({ where: { email, purpose, consumedAt: null }, orderBy: { createdAt: 'desc' } });
  if (!row || row.expiresAt < new Date() || row.attempts >= MAX_CODE_ATTEMPTS) throw badRequest('This code has expired. Please request a new one.', 'CODE_EXPIRED');
  const ok = crypto.timingSafeEqual(Buffer.from(row.codeHash), Buffer.from(codeHash(email, code)));
  if (!ok) {
    await db.emailVerificationCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    throw badRequest('That code is not correct', 'CODE_INVALID');
  }
  await db.emailVerificationCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });
  return row;
}

async function withCredential(id) {
  return db.customer.findUnique({ where: { id }, include: { credential: { select: { id: true } } } });
}

export async function me({ req }) {
  const c = await getCustomer(req);
  const admin = await getAdminEmail(req);
  return { customer: c ? customerOut(c) : null, isSuperAdmin: Boolean(admin) };
}

export async function register({ req, res, body, ip }) {
  await rateLimit(`reg:ip:${ip}`, 10, 3600);
  const mobile = vMobile(body.mobile);
  const data = {
    fullName: str(body.fullName, { max: 100, label: 'Name' }),
    mobile,
    age: age(body.age),
    preferredLanguage: vLang(body.language),
  };
  const pw = vPassword(body.password);
  if (await db.customer.findUnique({ where: { mobile } })) {
    throw conflict('This mobile number already has an account. Please sign in.', 'MOBILE_EXISTS');
  }
  const passwordHash = await hashPassword(pw);
  const c = await db.customer.create({ data: { ...data, credential: { create: { passwordHash } } } });
  await startCustomerSession(res, c.id);
  return { customer: customerOut(await withCredential(c.id)), isSuperAdmin: false };
}

export async function login({ req, res, body, ip }) {
  const mobile = normalizeMobile(body.mobile);
  if (!mobile || typeof body.password !== 'string') throw badRequest('Enter your mobile number and password', 'VALIDATION');
  await rateLimit(`login:ip:${ip}`, 30, 900);
  await rateLimit(`login:m:${mobile}`, 10, 900, 'Too many attempts for this number. Please wait a few minutes.');
  const c = await db.customer.findUnique({ where: { mobile }, include: { credential: true } });
  const ok = await verifyPassword(body.password, c?.credential?.passwordHash);
  if (!c || !ok) throw unauthorized('Mobile number or password is not correct', 'BAD_CREDENTIALS');
  await startCustomerSession(res, c.id);
  return { customer: customerOut({ ...c, credential: { id: c.credential.id } }), isSuperAdmin: false };
}

export async function emailRequest({ req, res, body, ip }) {
  const email = vEmail(body.email);
  await rateLimit(`ecode:ip:${ip}`, 20, 3600);
  await rateLimit(`ecode:e:${email}`, 5, 3600, 'Too many codes requested. Please try again in an hour.');
  const existing = await db.customer.findUnique({ where: { email } });
  await sendCode(email, 'LOGIN', body.language && ['ta', 'en', 'ml'].includes(body.language) ? body.language : existing?.preferredLanguage || 'en', existing?.id);
  return { sent: true };
}

export async function emailVerify({ req, res, body, ip }) {
  const email = vEmail(body.email);
  await rateLimit(`everify:ip:${ip}`, 30, 900);
  await rateLimit(`everify:e:${email}`, 15, 900);
  await checkCode(email, body.code, 'LOGIN');
  let c = await db.customer.findUnique({ where: { email } });
  if (!c) {
    c = await db.customer.create({
      data: {
        fullName: email.split('@')[0],
        email,
        emailVerifiedAt: new Date(),
        preferredLanguage: ['ta', 'en', 'ml'].includes(body.language) ? body.language : 'ta',
      },
    });
  } else if (!c.emailVerifiedAt) {
    await db.customer.update({ where: { id: c.id }, data: { emailVerifiedAt: new Date() } });
  }
  await startCustomerSession(res, c.id);
  // Email-code sign-in never grants admin rights.
  return { customer: customerOut(await withCredential(c.id)), isSuperAdmin: false };
}

// Google sign-in. mode=admin: only SUPER_ADMIN_EMAIL gets in. mode=customer: normal customer session;
// admin cookie is issued additionally only when the verified Google email equals SUPER_ADMIN_EMAIL.
export async function google({ req, res, body, ip }) {
  await rateLimit(`google:ip:${ip}`, 30, 900);
  if (typeof body.credential !== 'string' || body.credential.length > 4096) throw badRequest('Missing credential', 'VALIDATION');
  const g = await verifyGoogleCredential(body.credential);
  const isAdmin = Boolean(superAdminEmail()) && g.email === superAdminEmail();
  if (body.mode === 'admin') {
    if (!isAdmin) throw forbidden('This Google account is not authorised for Super Admin', 'NOT_ADMIN');
    await startAdminSession(res, g.email);
    return { isSuperAdmin: true, email: g.email };
  }
  let c = await db.customer.findUnique({ where: { email: g.email } });
  if (!c) {
    c = await db.customer.create({ data: { fullName: g.name || g.email.split('@')[0], email: g.email, emailVerifiedAt: new Date(), preferredLanguage: 'ta' } });
  } else if (!c.emailVerifiedAt) {
    await db.customer.update({ where: { id: c.id }, data: { emailVerifiedAt: new Date() } });
  }
  await startCustomerSession(res, c.id);
  if (isAdmin) await startAdminSession(res, g.email);
  return { customer: customerOut(await withCredential(c.id)), isSuperAdmin: isAdmin };
}

export async function logout({ res }) {
  endSessions(res);
  return { ok: true };
}

// ---------- account ----------
export async function updateProfile({ req, body }) {
  const c = await requireCustomer(req);
  const data = {};
  if (body.fullName !== undefined) data.fullName = str(body.fullName, { max: 100, label: 'Name' });
  if (body.age !== undefined && body.age !== null && body.age !== '') data.age = age(body.age);
  if (body.language !== undefined) data.preferredLanguage = vLang(body.language);
  const updated = await db.customer.update({ where: { id: c.id }, data, include: { credential: { select: { id: true } } } });
  return { customer: customerOut(updated) };
}

// For accounts created by email/Google that have no mobile + password yet.
export async function addCredentials({ req, body }) {
  const c = await requireCustomer(req);
  if (c.credential) throw conflict('Password is already set', 'ALREADY_SET');
  const mobile = vMobile(body.mobile);
  const pw = vPassword(body.password);
  if (await db.customer.findUnique({ where: { mobile } })) throw conflict('This mobile number already has an account', 'MOBILE_EXISTS');
  await db.customer.update({ where: { id: c.id }, data: { mobile, credential: { create: { passwordHash: await hashPassword(pw) } } } });
  return { customer: customerOut(await withCredential(c.id)) };
}

export async function addEmailRequest({ req, body }) {
  const c = await requireCustomer(req);
  const email = vEmail(body.email);
  await rateLimit(`addmail:c:${c.id}`, 5, 3600);
  const owner = await db.customer.findUnique({ where: { email } });
  if (owner && owner.id !== c.id) throw conflict('This email is already used by another account', 'EMAIL_EXISTS');
  await sendCode(email, 'VERIFY_EMAIL', c.preferredLanguage, c.id);
  return { sent: true };
}

export async function addEmailVerify({ req, body }) {
  const c = await requireCustomer(req);
  const email = vEmail(body.email);
  await rateLimit(`addmailv:c:${c.id}`, 15, 900);
  const row = await checkCode(email, body.code, 'VERIFY_EMAIL');
  if (row.customerId !== c.id) throw badRequest('This code is not valid for your account', 'CODE_INVALID');
  const owner = await db.customer.findUnique({ where: { email } });
  if (owner && owner.id !== c.id) throw conflict('This email is already used by another account', 'EMAIL_EXISTS');
  const updated = await db.customer.update({ where: { id: c.id }, data: { email, emailVerifiedAt: new Date() }, include: { credential: { select: { id: true } } } });
  return { customer: customerOut(updated) };
}
