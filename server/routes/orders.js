import crypto from 'node:crypto';
import { db } from '../lib/db.js';
import { requireCustomer } from '../lib/auth.js';
import { badRequest, conflict, notFound } from '../lib/http.js';
import { estimateDelivery } from '../lib/delivery.js';
import { createRazorpayOrder, razorpayConfigured, verifyPaymentSignature, verifyWebhookSignature } from '../lib/razorpay.js';
import { addressInput, int, str } from '../lib/validate.js';
import { effectivePrice, orderOut } from '../lib/serialize.js';
import { rateLimit } from '../lib/ratelimit.js';

const MAX_QTY = 10;
const orderInclude = { items: true, payments: true, events: true };

function orderNumber() {
  const d = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `PP-${d}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

// Create a pending order + Razorpay order. Prices always come from the database.
export async function createOrder({ req, body, ip }) {
  const c = await requireCustomer(req);
  await rateLimit(`order:c:${c.id}`, 20, 3600);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 20) throw badRequest('Your cart is empty', 'VALIDATION');

  const wanted = new Map();
  for (const i of body.items) {
    const id = str(i?.productId, { max: 40, label: 'Product' });
    wanted.set(id, Math.min(MAX_QTY, (wanted.get(id) || 0) + int(i?.quantity, { min: 1, max: MAX_QTY, label: 'Quantity' })));
  }
  const products = await db.product.findMany({ where: { id: { in: [...wanted.keys()] }, status: 'ACTIVE' }, include: { assets: true } });
  if (products.length !== wanted.size) throw conflict('An item in your order is no longer available', 'PRODUCT_UNAVAILABLE');
  for (const p of products) {
    if (p.stock < wanted.get(p.id)) throw conflict(`Only ${Math.max(p.stock, 0)} available`, 'OUT_OF_STOCK');
  }

  let addr;
  if (body.addressId) {
    const a = await db.address.findFirst({ where: { id: String(body.addressId), customerId: c.id } });
    if (!a) throw notFound('Address not found');
    const { id, customerId, isDefault, createdAt, ...rest } = a;
    addr = rest;
  } else {
    addr = addressInput(body.address || {});
    if (body.saveAddress) {
      const count = await db.address.count({ where: { customerId: c.id } });
      if (count < 10) await db.address.create({ data: { ...addr, customerId: c.id, isDefault: count === 0 } });
    }
  }

  const est = await estimateDelivery({ state: addr.state, country: addr.country });
  if (!est.shippable) throw badRequest('We cannot ship to this country online yet. Please contact us.', 'NOT_SHIPPABLE');

  const lines = products.map((p) => ({ p, qty: wanted.get(p.id), unit: effectivePrice(p) }));
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const total = subtotal + est.fee;
  const number = orderNumber();

  const rp = await createRazorpayOrder({ amountPaise: total * 100, receipt: number, notes: { customer: c.id } });

  const order = await db.order.create({
    data: {
      orderNumber: number,
      customerId: c.id,
      subtotal,
      shippingFee: est.fee,
      total,
      address: addr,
      estimatedFrom: new Date(est.from),
      estimatedTo: new Date(est.to),
      items: {
        create: lines.map(({ p, qty, unit }) => ({
          productId: p.id,
          name: p.name,
          imageUrl: [...p.assets].filter((a) => a.kind === 'IMAGE').sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url || null,
          unitPrice: unit,
          quantity: qty,
        })),
      },
      payments: { create: { razorpayOrderId: rp.id, amount: total } },
    },
    include: orderInclude,
  });
  return {
    order: orderOut(order),
    razorpay: { keyId: process.env.RAZORPAY_KEY_ID, orderId: rp.id, amount: total * 100, currency: 'INR', prefill: { name: addr.fullName, contact: addr.mobile, email: c.email || undefined } },
  };
}

// Mark an order paid exactly once; safe to call from both the browser callback and the webhook.
export async function settlePaid(razorpayOrderId, razorpayPaymentId) {
  return db.$transaction(async (tx) => {
    const pay = await tx.payment.findUnique({ where: { razorpayOrderId }, include: { order: { include: { items: true } } } });
    if (!pay) return null;
    // The conditional update takes a row lock, so a simultaneous browser callback + webhook settle only once.
    const claimed = await tx.payment.updateMany({
      where: { id: pay.id, status: { not: 'PAID' } },
      data: { status: 'PAID', razorpayPaymentId, paidAt: new Date(), failureReason: null },
    });
    if (claimed.count === 0) return pay.orderId;
    const shortages = [];
    for (const it of pay.order.items) {
      const r = await tx.product.updateMany({ where: { id: it.productId, stock: { gte: it.quantity } }, data: { stock: { decrement: it.quantity } } });
      if (r.count === 0) shortages.push(it.productId);
    }
    if (pay.order.status === 'AWAITING_PAYMENT' || pay.order.status === 'CANCELLED') {
      await tx.order.update({ where: { id: pay.orderId }, data: { status: 'PAYMENT_CONFIRMED' } });
      await tx.orderTrackingEvent.createMany({
        data: [
          { orderId: pay.orderId, status: 'PLACED' },
          { orderId: pay.orderId, status: 'PAYMENT_CONFIRMED' },
          ...(shortages.length ? [{ orderId: pay.orderId, status: 'PAYMENT_CONFIRMED', note: 'Stock check needed: paid quantity exceeded stock', byAdmin: true }] : []),
        ],
      });
    }
    return pay.orderId;
  });
}

export async function verifyPayment({ req, body, params }) {
  const c = await requireCustomer(req);
  const orderId = str(body.razorpay_order_id, { max: 80 });
  const paymentId = str(body.razorpay_payment_id, { max: 80 });
  const signature = str(body.razorpay_signature, { max: 200 });
  const order = await db.order.findFirst({ where: { id: params.id, customerId: c.id }, include: { payments: true } });
  if (!order) throw notFound('Order not found');
  if (!order.payments.some((p) => p.razorpayOrderId === orderId)) throw badRequest('Payment does not match this order', 'MISMATCH');
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    await db.payment.updateMany({ where: { razorpayOrderId: orderId, status: 'CREATED' }, data: { status: 'FAILED', failureReason: 'Signature verification failed' } });
    throw badRequest('Payment could not be verified', 'SIGNATURE_INVALID');
  }
  await settlePaid(orderId, paymentId);
  const fresh = await db.order.findUnique({ where: { id: order.id }, include: orderInclude });
  return { order: orderOut(fresh) };
}

export async function paymentFailed({ req, body, params }) {
  const c = await requireCustomer(req);
  const order = await db.order.findFirst({ where: { id: params.id, customerId: c.id } });
  if (!order) throw notFound('Order not found');
  // Only an unpaid attempt can be marked failed; a PAID payment is never downgraded.
  await db.payment.updateMany({ where: { orderId: order.id, status: 'CREATED' }, data: { status: 'FAILED', failureReason: str(body.reason || 'Payment not completed', { max: 200 }) } });
  return { ok: true };
}

export async function listOrders({ req }) {
  const c = await requireCustomer(req);
  const rows = await db.order.findMany({ where: { customerId: c.id, status: { not: 'AWAITING_PAYMENT' } }, include: orderInclude, orderBy: { createdAt: 'desc' } });
  return { orders: rows.map((o) => orderOut(o)) };
}

export async function getOrder({ req, params }) {
  const c = await requireCustomer(req);
  const o = await db.order.findFirst({ where: { id: params.id, customerId: c.id }, include: orderInclude });
  if (!o) throw notFound('Order not found');
  return { order: orderOut(o) };
}

// Razorpay webhook: completes payments the browser never reported back.
export async function webhook({ req, raw, body }) {
  if (!razorpayConfigured() || !verifyWebhookSignature(raw, req.headers['x-razorpay-signature'])) throw badRequest('Invalid signature', 'SIGNATURE_INVALID');
  const ent = body?.payload?.payment?.entity;
  if (body.event === 'payment.captured' || body.event === 'order.paid') {
    const ordId = ent?.order_id || body?.payload?.order?.entity?.id;
    if (ordId && ent?.id) await settlePaid(ordId, ent.id);
  } else if (body.event === 'payment.failed' && ent?.order_id) {
    await db.payment.updateMany({ where: { razorpayOrderId: ent.order_id, status: 'CREATED' }, data: { status: 'FAILED', failureReason: String(ent.error_description || 'Payment failed').slice(0, 200) } });
  }
  return { ok: true };
}
