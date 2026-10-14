import { HttpError, clientIp, forbidden, parseJson, readRaw, send } from './lib/http.js';
import * as auth from './routes/auth.js';
import * as shop from './routes/shop.js';
import * as orders from './routes/orders.js';
import * as admin from './routes/admin.js';

const R = (method, path, handler, opts = {}) => ({ method, parts: path.split('/').filter(Boolean), handler, ...opts });

const routes = [
  R('GET', '/config', shop.config),
  R('GET', '/products', shop.listProducts),
  R('GET', '/products/:slug', shop.getProduct),
  R('GET', '/delivery/estimate', shop.deliveryEstimate),
  R('POST', '/contact', shop.contact),

  R('GET', '/auth/me', auth.me),
  R('POST', '/auth/register', auth.register),
  R('POST', '/auth/login', auth.login),
  R('POST', '/auth/email/request', auth.emailRequest),
  R('POST', '/auth/email/verify', auth.emailVerify),
  R('POST', '/auth/google', auth.google),
  R('POST', '/auth/logout', auth.logout),

  R('PATCH', '/account/profile', auth.updateProfile),
  R('POST', '/account/credentials', auth.addCredentials),
  R('POST', '/account/email/request', auth.addEmailRequest),
  R('POST', '/account/email/verify', auth.addEmailVerify),

  R('GET', '/cart', shop.getCart),
  R('PUT', '/cart', shop.putCart),
  R('POST', '/cart/merge', shop.mergeCart),

  R('GET', '/addresses', shop.listAddresses),
  R('POST', '/addresses', shop.createAddress),
  R('PUT', '/addresses/:id', shop.updateAddress),
  R('DELETE', '/addresses/:id', shop.deleteAddress),

  R('POST', '/orders', orders.createOrder),
  R('GET', '/orders', orders.listOrders),
  R('GET', '/orders/:id', orders.getOrder),
  R('POST', '/orders/:id/verify', orders.verifyPayment),
  R('POST', '/orders/:id/failed', orders.paymentFailed),
  R('POST', '/razorpay/webhook', orders.webhook, { webhook: true }),

  R('GET', '/admin/me', admin.adminMe),
  R('GET', '/admin/summary', admin.summary),
  R('GET', '/admin/products', admin.adminListProducts),
  R('POST', '/admin/products', admin.adminCreateProduct),
  R('PUT', '/admin/products/:id', admin.adminUpdateProduct),
  R('DELETE', '/admin/products/:id', admin.adminArchiveProduct),
  R('GET', '/admin/orders', admin.adminListOrders),
  R('PATCH', '/admin/orders/:id', admin.adminUpdateOrder),
  R('GET', '/admin/payments', admin.adminPayments),
  R('GET', '/admin/customers', admin.adminCustomers),
  R('GET', '/admin/settings/delivery', admin.adminGetDelivery),
  R('PUT', '/admin/settings/delivery', admin.adminPutDelivery),
];

function match(method, parts) {
  let pathMatched = false;
  for (const r of routes) {
    if (r.parts.length !== parts.length) continue;
    const params = {};
    const ok = r.parts.every((p, i) => (p.startsWith(':') ? ((params[p.slice(1)] = decodeURIComponent(parts[i])), true) : p === parts[i]));
    if (!ok) continue;
    pathMatched = true;
    if (r.method === method) return { route: r, params };
  }
  return { pathMatched };
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host; // dev proxy / platform proxies
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://x');
    const parts = url.pathname.replace(/^\/api/, '').split('/').filter(Boolean);
    const { route, params, pathMatched } = match(req.method, parts);
    if (!route) throw new HttpError(pathMatched ? 405 : 404, pathMatched ? 'Method not allowed' : 'Not found');
    const mutating = req.method !== 'GET';
    if (mutating && !route.webhook && !sameOrigin(req)) throw forbidden('Cross-site request blocked');
    let raw = Buffer.alloc(0);
    let body = {};
    if (mutating) {
      raw = await readRaw(req);
      body = parseJson(raw);
    }
    const out = await route.handler({ req, res, body, raw, params, query: url.searchParams, ip: clientIp(req) });
    send(res, 200, out ?? { ok: true });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message, code: e.code });
    console.error(e);
    send(res, 500, { error: 'Something went wrong. Please try again.', code: 'SERVER' });
  }
}
