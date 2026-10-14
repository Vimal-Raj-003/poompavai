import { db } from '../lib/db.js';
import { requireCustomer } from '../lib/auth.js';
import { badRequest, notFound } from '../lib/http.js';
import { estimateDelivery, getDeliverySettings } from '../lib/delivery.js';
import { addressOut, effectivePrice, productPublic } from '../lib/serialize.js';
import { addressInput, int, str } from '../lib/validate.js';
import { rateLimit } from '../lib/ratelimit.js';
import { razorpayConfigured } from '../lib/razorpay.js';

const MAX_QTY = 10;

export async function config() {
  const d = await getDeliverySettings();
  const all = [d.defaultZone, ...d.zones];
  return {
    deliveryRange: { min: d.processingDays + Math.min(...all.map((z) => z.minDays)), max: d.processingDays + Math.max(...all.map((z) => z.maxDays)) },
    razorpayKeyId: razorpayConfigured() ? process.env.RAZORPAY_KEY_ID : null,
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    maxQty: MAX_QTY,
  };
}

// ---------- catalogue ----------
const productInclude = { assets: true };

export async function listProducts() {
  const rows = await db.product.findMany({ where: { status: 'ACTIVE' }, include: productInclude, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  return { products: rows.map(productPublic) };
}

export async function getProduct({ params }) {
  const p = await db.product.findFirst({ where: { slug: params.slug, status: 'ACTIVE' }, include: productInclude });
  if (!p) throw notFound('Product not found');
  return { product: productPublic(p) };
}

export async function deliveryEstimate({ query }) {
  return estimateDelivery({ state: query.get('state') || '', country: query.get('country') || 'India' });
}

export async function contact({ body, ip }) {
  await rateLimit(`contact:ip:${ip}`, 5, 3600);
  await db.contactMessage.create({
    data: { name: str(body.name, { max: 100, label: 'Name' }), contact: str(body.contact, { max: 150, label: 'Phone or email' }), message: str(body.message, { max: 2000, label: 'Message' }) },
  });
  return { ok: true };
}

// ---------- cart ----------
function cleanItems(raw) {
  if (!Array.isArray(raw) || raw.length > 20) throw badRequest('Invalid cart', 'VALIDATION');
  const map = new Map();
  for (const i of raw) {
    const id = str(i?.productId, { max: 40, label: 'Product' });
    const q = int(i?.quantity, { min: 1, max: MAX_QTY, label: 'Quantity' });
    map.set(id, Math.min(MAX_QTY, (map.get(id) || 0) + q));
  }
  return map;
}

async function cartView(customerId) {
  const cart = await db.cart.findUnique({
    where: { customerId },
    include: { items: { include: { product: { include: productInclude } } } },
  });
  const items = (cart?.items || [])
    .filter((i) => i.product.status === 'ACTIVE')
    .map((i) => ({ productId: i.productId, quantity: Math.min(i.quantity, MAX_QTY), product: productPublic(i.product), unitPrice: effectivePrice(i.product) }));
  return { items, subtotal: items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) };
}

async function writeCart(customerId, map) {
  const products = await db.product.findMany({ where: { id: { in: [...map.keys()] }, status: 'ACTIVE' }, select: { id: true } });
  const valid = new Set(products.map((p) => p.id));
  const cart = await db.cart.upsert({ where: { customerId }, update: {}, create: { customerId } });
  await db.$transaction([
    db.cartItem.deleteMany({ where: { cartId: cart.id } }),
    db.cartItem.createMany({ data: [...map].filter(([id]) => valid.has(id)).map(([productId, quantity]) => ({ cartId: cart.id, productId, quantity })) }),
  ]);
}

export async function getCart({ req }) {
  const c = await requireCustomer(req);
  return cartView(c.id);
}

export async function putCart({ req, body }) {
  const c = await requireCustomer(req);
  await writeCart(c.id, cleanItems(body.items));
  return cartView(c.id);
}

// Merge a guest cart into the saved cart after sign-in (quantities add, capped).
export async function mergeCart({ req, body }) {
  const c = await requireCustomer(req);
  const incoming = cleanItems(body.items || []);
  const existing = await db.cartItem.findMany({ where: { cart: { customerId: c.id } } });
  const merged = new Map(existing.map((i) => [i.productId, i.quantity]));
  for (const [id, q] of incoming) merged.set(id, Math.min(MAX_QTY, (merged.get(id) || 0) + q));
  await writeCart(c.id, merged);
  return cartView(c.id);
}

// ---------- addresses ----------
export async function listAddresses({ req }) {
  const c = await requireCustomer(req);
  const rows = await db.address.findMany({ where: { customerId: c.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  return { addresses: rows.map(addressOut) };
}

export async function createAddress({ req, body }) {
  const c = await requireCustomer(req);
  const data = addressInput(body);
  const count = await db.address.count({ where: { customerId: c.id } });
  if (count >= 10) throw badRequest('You can save up to 10 addresses', 'LIMIT');
  const isDefault = count === 0 || body.isDefault === true;
  if (isDefault) await db.address.updateMany({ where: { customerId: c.id }, data: { isDefault: false } });
  const a = await db.address.create({ data: { ...data, customerId: c.id, isDefault } });
  return { address: addressOut(a) };
}

export async function updateAddress({ req, body, params }) {
  const c = await requireCustomer(req);
  const own = await db.address.findFirst({ where: { id: params.id, customerId: c.id } });
  if (!own) throw notFound('Address not found');
  const data = addressInput(body);
  if (body.isDefault === true) await db.address.updateMany({ where: { customerId: c.id }, data: { isDefault: false } });
  const a = await db.address.update({ where: { id: own.id }, data: { ...data, ...(body.isDefault === true ? { isDefault: true } : {}) } });
  return { address: addressOut(a) };
}

export async function deleteAddress({ req, params }) {
  const c = await requireCustomer(req);
  const own = await db.address.findFirst({ where: { id: params.id, customerId: c.id } });
  if (!own) throw notFound('Address not found');
  await db.address.delete({ where: { id: own.id } });
  return { ok: true };
}
