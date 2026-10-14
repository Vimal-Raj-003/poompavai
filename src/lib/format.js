const LOCALE = { ta: 'ta-IN', en: 'en-IN', ml: 'ml-IN' };

export const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export const fmtDate = (d, lang, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Intl.DateTimeFormat(LOCALE[lang] || 'en-IN', opts).format(new Date(d));

export const fmtDateTime = (d, lang) =>
  fmtDate(d, lang, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// Pick the right language from a {ta,en,ml} object, falling back to English.
export const L = (obj, lang) => (obj && (obj[lang] || obj.en)) || '';

export const discountPct = (p) => (p.offerPrice ? Math.round(((p.price - p.offerPrice) / p.price) * 100) : 0);
export const unitPrice = (p) => p.offerPrice ?? p.price;
