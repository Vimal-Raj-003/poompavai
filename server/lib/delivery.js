import { db } from './db.js';

export const DEFAULT_DELIVERY = {
  processingDays: 1,
  defaultZone: { name: 'Rest of India', minDays: 3, maxDays: 5, fee: 0 },
  zones: [
    { name: 'Tamil Nadu', states: ['Tamil Nadu'], minDays: 1, maxDays: 2, fee: 0 },
    { name: 'South India', states: ['Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry'], minDays: 2, maxDays: 4, fee: 0 },
  ],
  international: { enabled: false, minDays: 10, maxDays: 15, fee: 0 },
};

export async function getDeliverySettings() {
  const row = await db.setting.findUnique({ where: { key: 'delivery' } });
  return { ...DEFAULT_DELIVERY, ...(row?.value || {}) };
}

// Add business days (Mon-Sat; Sundays skipped) to a date.
export function addBusinessDays(from, days) {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) left--;
  }
  return d;
}

const norm = (s) => String(s || '').trim().toLowerCase();

export async function estimateDelivery({ state, country }, now = new Date()) {
  const s = await getDeliverySettings();
  const domestic = norm(country || 'India') === 'india';
  let zone;
  if (!domestic) {
    if (!s.international?.enabled) return { shippable: false, reason: 'INTERNATIONAL_DISABLED' };
    zone = { name: 'International', ...s.international };
  } else {
    zone = s.zones.find((z) => z.states?.some((x) => norm(x) === norm(state))) || s.defaultZone;
  }
  const minDays = s.processingDays + zone.minDays;
  const maxDays = s.processingDays + zone.maxDays;
  return {
    shippable: true,
    zone: zone.name,
    minDays,
    maxDays,
    fee: zone.fee || 0,
    from: addBusinessDays(now, minDays).toISOString(),
    to: addBusinessDays(now, maxDays).toISOString(),
  };
}
