import crypto from 'node:crypto';
import { HttpError } from './http.js';

const base = () => process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com';

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function createRazorpayOrder({ amountPaise, receipt, notes }) {
  if (!razorpayConfigured()) throw new HttpError(503, 'Online payment is not available right now', 'CONFIG');
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const r = await fetch(`${base()}/v1/orders`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes }),
  });
  if (!r.ok) throw new HttpError(502, 'Could not start the payment. Please try again.', 'PAYMENT_START_FAILED');
  return r.json();
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a), 'utf8');
  const y = Buffer.from(String(b), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Checkout callback signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
export function verifyPaymentSignature(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature || '');
}

export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEqual(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), signature || '');
}
