import { badRequest } from './http.js';

export const LANGS = ['ta', 'en', 'ml'];

export function str(v, { min = 1, max = 200, label = 'Value' } = {}) {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
  if (s.length < min || s.length > max) throw badRequest(`${label} is invalid`, 'VALIDATION');
  return s;
}

export function optStr(v, opts) {
  if (v === undefined || v === null || v === '') return null;
  return str(v, opts);
}

export function normalizeMobile(input) {
  if (typeof input !== 'string') return null;
  const s = input.replace(/[\s\-().]/g, '');
  if (/^[6-9]\d{9}$/.test(s)) return `+91${s}`;
  if (/^0[6-9]\d{9}$/.test(s)) return `+91${s.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(s)) return `+${s}`;
  if (/^\+\d{8,15}$/.test(s)) return s;
  return null;
}

export function mobile(v) {
  const m = normalizeMobile(v);
  if (!m) throw badRequest('Enter a valid mobile number', 'VALIDATION');
  return m;
}

export function email(v) {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (s.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) throw badRequest('Enter a valid email address', 'VALIDATION');
  return s;
}

export function password(v) {
  if (typeof v !== 'string' || v.length < 8 || v.length > 128) throw badRequest('Password must be at least 8 characters', 'VALIDATION');
  return v;
}

export function age(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 13 || n > 110) throw badRequest('Enter a valid age', 'VALIDATION');
  return n;
}

export function lang(v) {
  if (!LANGS.includes(v)) throw badRequest('Choose a language', 'VALIDATION');
  return v;
}

export function int(v, { min = 0, max = 10_000_000, label = 'Value' } = {}) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw badRequest(`${label} is invalid`, 'VALIDATION');
  return n;
}

export function pincode(v, country) {
  const s = str(v, { min: 3, max: 12, label: 'PIN code' });
  if ((country || 'India') === 'India' && !/^[1-9]\d{5}$/.test(s)) throw badRequest('Enter a valid 6-digit PIN code', 'VALIDATION');
  return s;
}

export function addressInput(b) {
  const country = str(b.country || 'India', { max: 60, label: 'Country' });
  return {
    fullName: str(b.fullName, { max: 100, label: 'Name' }),
    mobile: mobile(b.mobile),
    line1: str(b.line1, { max: 120, label: 'House / door number' }),
    line2: str(b.line2, { max: 160, label: 'Street / area' }),
    landmark: optStr(b.landmark, { max: 120, label: 'Landmark' }),
    city: str(b.city, { max: 80, label: 'City' }),
    district: str(b.district, { max: 80, label: 'District' }),
    state: str(b.state, { max: 80, label: 'State' }),
    pincode: pincode(b.pincode, country),
    country,
  };
}

// {ta,en,ml} text object from admin input. English is mandatory; others fall back to English.
export function i18n(v, label, { max = 2000, required = true } = {}) {
  const o = v && typeof v === 'object' ? v : {};
  const en = typeof o.en === 'string' ? o.en.trim() : '';
  if (required && !en) throw badRequest(`${label} (English) is required`, 'VALIDATION');
  const out = {};
  for (const l of LANGS) {
    const t = typeof o[l] === 'string' ? o[l].trim() : '';
    if (t.length > max) throw badRequest(`${label} is too long`, 'VALIDATION');
    out[l] = t;
  }
  return out;
}
