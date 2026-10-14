// End-to-end API smoke test against a LOCAL database (never run against production).
//   node --env-file=.env scripts/smoke.mjs
// Spins up the API in-process plus a fake Razorpay; exercises auth, cart, checkout, payment
// verification, tracking, admin protection and ownership rules.
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';

process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'dummy_secret_value';
process.env.RAZORPAY_WEBHOOK_SECRET = 'dummy_webhook_secret';
process.env.SUPER_ADMIN_EMAIL = 'owner@example.com';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';

const fakeRp = http.createServer((req, res) => {
  let b = '';
  req.on('data', (c) => (b += c));
  req.on('end', () => {
    const j = JSON.parse(b || '{}');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ id: 'order_' + crypto.randomBytes(6).toString('hex'), amount: j.amount, currency: 'INR' }));
  });
});
await new Promise((r) => fakeRp.listen(0, r));
process.env.RAZORPAY_API_BASE = `http://localhost:${fakeRp.address().port}`;

const { default: handler } = await import('../server/router.js');
const { db } = await import('../server/lib/db.js');
const { verifyGoogleCredential } = await import('../server/lib/auth.js');
const api = http.createServer((q, s) => handler(q, s));
await new Promise((r) => api.listen(0, r));
const base = `http://localhost:${api.address().port}/api`;

class Client {
  jar = {};
  async call(method, path, body, headers = {}) {
    const r = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', Cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; '), ...headers },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    for (const c of r.headers.getSetCookie()) {
      const [kv] = c.split(';');
      const i = kv.indexOf('=');
      const v = kv.slice(i + 1);
      if (/Max-Age=0/i.test(c) || v === '') delete this.jar[kv.slice(0, i)];
      else this.jar[kv.slice(0, i)] = v;
    }
    return { status: r.status, data: await r.json().catch(() => ({})) };
  }
}
let n = 0;
const ok = (name) => console.log(`  ok ${String(++n).padStart(2)}  ${name}`);

const stamp = Date.now();
const mobile = `9${String(stamp).slice(-9)}`;
const a = new Client();

// --- public browsing, no login
let r = await a.call('GET', '/products');
assert.equal(r.status, 200);
assert.equal(r.data.products.length, 4);
const prods = r.data.products;
ok('public product list (4 products, no login)');
r = await a.call('GET', `/products/${prods[0].slug}`);
assert.equal(r.status, 200);
r = await a.call('GET', '/cart');
assert.equal(r.status, 401);
ok('product detail public; cart needs login');

// --- register / validation
r = await a.call('POST', '/auth/register', { fullName: 'Test User', mobile: '12345', age: 40, language: 'ta', password: 'secret123' });
assert.equal(r.status, 400);
r = await a.call('POST', '/auth/register', { fullName: 'Test User', mobile, age: 40, language: 'ta', password: 'short' });
assert.equal(r.status, 400);
r = await a.call('POST', '/auth/register', { fullName: 'Test User', mobile, age: 40, language: 'ta', password: 'secret123' });
assert.equal(r.status, 200);
assert.equal(r.data.customer.mobile, `+91${mobile}`);
assert.equal(r.data.isSuperAdmin, false);
ok('register validates input and logs in');
const stored = await db.customerCredential.findFirst({ where: { customer: { mobile: `+91${mobile}` } } });
assert.ok(stored.passwordHash.startsWith('scrypt$') && !stored.passwordHash.includes('secret123'));
ok('password stored as scrypt hash, not plain text');
r = await new Client().call('POST', '/auth/register', { fullName: 'Dup', mobile, age: 40, language: 'en', password: 'secret123' });
assert.equal(r.status, 409);
ok('duplicate mobile rejected');

// --- login
const b = new Client();
r = await b.call('POST', '/auth/login', { mobile, password: 'wrongpass1' });
assert.equal(r.status, 401);
r = await b.call('POST', '/auth/login', { mobile: `+91 ${mobile}`, password: 'secret123' });
assert.equal(r.status, 200);
r = await b.call('GET', '/auth/me');
assert.equal(r.data.customer.fullName, 'Test User');
assert.equal(r.data.isSuperAdmin, false);
ok('mobile + password login; /me shows no admin');

// --- email code sign-in
const email = `buyer${stamp}@example.com`;
const c = new Client();
r = await c.call('POST', '/auth/email/request', { email });
assert.equal(r.status, 200);
r = await c.call('POST', '/auth/email/verify', { email, code: '000000' });
assert.equal(r.status, 400);
// read the code via a controlled re-issue: replace the stored hash with a known code
const code = '123456';
const hash = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(`${email}:${code}`).digest('hex');
await db.emailVerificationCode.updateMany({ where: { email, consumedAt: null }, data: { codeHash: hash, attempts: 0 } });
r = await c.call('POST', '/auth/email/verify', { email, code });
assert.equal(r.status, 200);
assert.equal(r.data.customer.email, email);
assert.equal(r.data.isSuperAdmin, false);
r = await new Client().call('POST', '/auth/email/verify', { email, code });
assert.equal(r.status, 400); // single use
ok('email code: wrong code rejected, right code logs in, code is single-use');
await db.emailVerificationCode.updateMany({ where: { email }, data: { expiresAt: new Date(Date.now() - 1000), consumedAt: null } });
r = await new Client().call('POST', '/auth/email/verify', { email, code });
assert.equal(r.status, 400);
ok('expired code rejected');

// email-only customer must never become admin, even with the super admin email
const adminEmail = 'owner@example.com';
const d = new Client();
await d.call('POST', '/auth/email/request', { email: adminEmail });
await db.emailVerificationCode.updateMany({ where: { email: adminEmail, consumedAt: null }, data: { codeHash: crypto.createHmac('sha256', process.env.SESSION_SECRET).update(`${adminEmail}:${code}`).digest('hex') } });
r = await d.call('POST', '/auth/email/verify', { email: adminEmail, code });
assert.equal(r.status, 200);
assert.equal(r.data.isSuperAdmin, false);
r = await d.call('GET', '/admin/summary');
assert.equal(r.status, 403);
ok('super-admin email via email-code login still gets 403 on admin API');

// --- admin API blocked for customers / anonymous
for (const [m, p] of [['GET', '/admin/summary'], ['GET', '/admin/orders'], ['GET', '/admin/customers'], ['GET', '/admin/payments'], ['GET', '/admin/products'], ['PUT', '/admin/settings/delivery']]) {
  assert.equal((await b.call(m, p, m === 'GET' ? undefined : {})).status, 403, p);
  assert.equal((await new Client().call(m, p, m === 'GET' ? undefined : {})).status, 403, p);
}
r = await b.call('GET', '/admin/me');
assert.equal(r.data.isSuperAdmin, false);
ok('every admin endpoint returns 403 for customers and anonymous');

// --- Google admin login using a locally signed token (real verification path, test keys)
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), alg: 'RS256', kid: 'k1' };
const resolver = createLocalJWKSet({ keys: [jwk] });
const gtoken = (em, extra = {}) => new SignJWT({ email: em, email_verified: true, name: 'G User', ...extra }).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer('https://accounts.google.com').setAudience('test-client-id').setIssuedAt().setExpirationTime('5m').sign(privateKey);
assert.deepEqual((await verifyGoogleCredential(await gtoken('x@y.com'), resolver)).email, 'x@y.com');
await assert.rejects(verifyGoogleCredential(await gtoken('x@y.com', { email_verified: false }), resolver));
await assert.rejects(verifyGoogleCredential('garbage', resolver));
ok('Google token verification: accepts valid, rejects unverified email and garbage');

// --- ordering
await db.product.update({ where: { id: prods[1].id }, data: { stock: 8 } });
const addr = { fullName: 'Test User', mobile, line1: '12', line2: 'Temple Street', landmark: 'Near tank', city: 'Thanjavur', district: 'Thanjavur', state: 'Tamil Nadu', pincode: '613001', country: 'India' };
r = await b.call('POST', '/orders', { items: [{ productId: prods[1].id, quantity: 99 }], address: addr });
assert.equal(r.status, 400);
r = await b.call('POST', '/orders', { items: [{ productId: prods[1].id, quantity: 2, price: 1 }], address: { ...addr, pincode: 'abc' } });
assert.equal(r.status, 400);
r = await b.call('POST', '/orders', { items: [{ productId: prods[1].id, quantity: 2, price: 1 }], address: addr, saveAddress: true });
assert.equal(r.status, 200, JSON.stringify(r.data));
const unit = prods[1].offerPrice ?? prods[1].price;
assert.equal(r.data.order.subtotal, unit * 2);
assert.equal(r.data.razorpay.amount, unit * 2 * 100);
assert.equal(r.data.razorpay.keyId, 'rzp_test_dummy');
assert.ok(!JSON.stringify(r.data).includes('dummy_secret_value'));
ok('order priced by the server (client "price" ignored); secret never returned');
const order = r.data.order;
const rpOrderId = r.data.razorpay.orderId;
assert.equal(order.status, 'AWAITING_PAYMENT');
assert.ok(order.estimatedFrom && order.estimatedTo);

r = await b.call('POST', `/orders/${order.id}/verify`, { razorpay_order_id: rpOrderId, razorpay_payment_id: 'pay_x1', razorpay_signature: 'bad' });
assert.equal(r.status, 400);
assert.equal((await db.order.findUnique({ where: { id: order.id } })).status, 'AWAITING_PAYMENT');
ok('bad signature rejected; order stays unpaid');

const sig = crypto.createHmac('sha256', 'dummy_secret_value').update(`${rpOrderId}|pay_x2`).digest('hex');
const stockBefore = (await db.product.findUnique({ where: { id: prods[1].id } })).stock;
const e = new Client();
await e.call('POST', '/auth/login', { mobile, password: 'secret123' });
r = await e.call('POST', `/orders/${order.id}/verify`, { razorpay_order_id: rpOrderId, razorpay_payment_id: 'pay_x2', razorpay_signature: sig });
assert.equal(r.status, 200, JSON.stringify(r.data));
assert.equal(r.data.order.status, 'PAYMENT_CONFIRMED');
assert.equal(r.data.order.paymentStatus, 'PAID');
assert.deepEqual(r.data.order.events.map((x) => x.status), ['PLACED', 'PAYMENT_CONFIRMED']);
assert.equal((await db.product.findUnique({ where: { id: prods[1].id } })).stock, stockBefore - 2);
ok('valid signature -> PAID, tracking events, stock decremented');
await Promise.all([
  e.call('POST', `/orders/${order.id}/verify`, { razorpay_order_id: rpOrderId, razorpay_payment_id: 'pay_x2', razorpay_signature: sig }),
  e.call('POST', `/orders/${order.id}/verify`, { razorpay_order_id: rpOrderId, razorpay_payment_id: 'pay_x2', razorpay_signature: sig }),
]);
assert.equal((await db.product.findUnique({ where: { id: prods[1].id } })).stock, stockBefore - 2);
assert.equal((await db.orderTrackingEvent.count({ where: { orderId: order.id, status: 'PLACED' } })), 1);
ok('repeat / concurrent verification is idempotent (stock and events not duplicated)');

// webhook
const wbody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_x2', order_id: rpOrderId } } } });
r = await new Client().call('POST', '/razorpay/webhook', wbody, { 'x-razorpay-signature': 'nope' });
assert.equal(r.status, 400);
r = await new Client().call('POST', '/razorpay/webhook', wbody, { 'x-razorpay-signature': crypto.createHmac('sha256', 'dummy_webhook_secret').update(wbody).digest('hex') });
assert.equal(r.status, 200);
ok('webhook requires a valid signature');

// ownership
const other = new Client();
await other.call('POST', '/auth/email/request', { email });
await db.emailVerificationCode.updateMany({ where: { email, consumedAt: null }, data: { codeHash: hash, attempts: 0, expiresAt: new Date(Date.now() + 60000) } });
await other.call('POST', '/auth/email/verify', { email, code });
assert.equal((await other.call('GET', `/orders/${order.id}`)).status, 404);
assert.equal((await other.call('POST', `/orders/${order.id}/verify`, { razorpay_order_id: rpOrderId, razorpay_payment_id: 'pay_x2', razorpay_signature: sig })).status, 404);
assert.equal((await other.call('GET', '/orders')).data.orders.length, 0);
assert.equal((await e.call('GET', `/orders/${order.id}`)).status, 200);
ok("a customer cannot read or pay another customer's order");

// addresses saved + reuse
r = await e.call('GET', '/addresses');
assert.equal(r.data.addresses.length, 1);
ok('address saved from checkout');

// cart persistence + merge
r = await e.call('POST', '/cart/merge', { items: [{ productId: prods[0].id, quantity: 2 }] });
r = await e.call('POST', '/cart/merge', { items: [{ productId: prods[0].id, quantity: 1 }, { productId: prods[2].id, quantity: 1 }] });
assert.equal(r.data.items.find((i) => i.productId === prods[0].id).quantity, 3);
r = await e.call('PUT', '/cart', { items: [{ productId: prods[2].id, quantity: 4 }] });
assert.equal(r.data.items.length, 1);
assert.equal(r.data.subtotal, 4 * (prods[2].offerPrice ?? prods[2].price));
ok('cart merge / replace / totals');

// international blocked by default
r = await e.call('POST', '/orders', { items: [{ productId: prods[0].id, quantity: 1 }], address: { ...addr, country: 'Singapore', pincode: '123456' } });
assert.equal(r.status, 400);
assert.equal(r.data.code, 'NOT_SHIPPABLE');
ok('international order blocked while disabled in delivery settings');

// delivery estimate
r = await new Client().call('GET', '/delivery/estimate?state=Tamil%20Nadu&country=India');
assert.equal(r.data.shippable, true);
assert.ok(r.data.maxDays >= r.data.minDays);
ok('delivery estimate configurable endpoint');

// rate limit
const rl = new Client();
let last;
for (let i = 0; i < 12; i++) last = await rl.call('POST', '/auth/login', { mobile: '9000000001', password: 'whateverpw' });
assert.equal(last.status, 429);
ok('login brute force is rate limited (429)');

// admin via local session cookie: forge nothing - issue admin cookie through the Google route with injected resolver is
// covered above; here verify cross-site POST is blocked.
r = await b.call('POST', '/auth/logout', {}, { Origin: 'https://evil.example' });
assert.equal(r.status, 403);
ok('cross-site POST blocked');

// --- admin happy path (cookie minted the same way the Google route does) ---
const mint = (sub) => new SignJWT({ sub, t: 'a' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(process.env.SESSION_SECRET));
const adm = new Client();
adm.jar.pp_admin = await mint('owner@example.com');
r = await adm.call('GET', '/admin/me');
assert.equal(r.data.isSuperAdmin, true);
const wrong = new Client();
wrong.jar.pp_admin = await mint('someone@else.com');
assert.equal((await wrong.call('GET', '/admin/summary')).status, 403);
r = await adm.call('GET', '/admin/summary');
assert.equal(r.status, 200, JSON.stringify(r.data));
assert.equal(r.data.cards.paidOrders >= 1, true);
assert.equal(r.data.charts.revenueTrend.length, 30);
assert.ok(r.data.cards.totalRevenue >= unit * 2);
ok('admin summary (real data) only for the SUPER_ADMIN_EMAIL cookie');
r = await adm.call('PATCH', `/admin/orders/${order.id}`, { status: 'PACKED', note: 'Boxed' });
assert.equal(r.status, 200);
r = await adm.call('PATCH', `/admin/orders/${order.id}`, { status: 'SHIPPED', courierName: 'DTDC', trackingNumber: 'D123', trackingUrl: 'https://track.example/D123' });
assert.equal(r.data.order.status, 'SHIPPED');
r = await e.call('GET', `/orders/${order.id}`);
assert.deepEqual(r.data.order.events.map((x) => x.status), ['PLACED', 'PAYMENT_CONFIRMED', 'PACKED', 'SHIPPED']);
assert.equal(r.data.order.courierName, 'DTDC');
ok('admin status update + courier details visible to the customer with timestamps');
r = await adm.call('GET', '/admin/orders');
assert.ok(r.data.orders[0].customer);
r = await adm.call('GET', '/admin/customers');
assert.ok(!JSON.stringify(r.data).toLowerCase().includes('passwordhash'));
r = await adm.call('GET', '/admin/payments');
assert.ok(!JSON.stringify(r.data).includes('dummy_secret_value'));
ok('admin lists never expose password hashes or secrets');
const pr = await adm.call('POST', '/admin/products', { name: { en: 'Test Doll' }, shortDesc: { en: 'x' }, price: 500, stock: 1, images: [{ url: '/products/img1.webp' }] });
assert.equal(pr.status, 200, JSON.stringify(pr.data));
const up = await adm.call('PUT', `/admin/products/${pr.data.product.id}`, { name: { en: 'Test Doll', ta: 'சோதனை' }, shortDesc: { en: 'x' }, price: 500, offerPrice: 400, stock: 1, status: 'DISABLED', images: [{ url: '/products/img1.webp' }] });
assert.equal(up.status, 200);
assert.equal((await new Client().call('GET', `/products/${pr.data.product.slug}`)).status, 404);
await adm.call('DELETE', `/admin/products/${pr.data.product.id}`);
await db.product.delete({ where: { id: pr.data.product.id } });
ok('admin product create / update / disable hides it from the storefront');

console.log(`\nAll ${n} checks passed`);
await db.rateLimit.deleteMany({});
await db.$disconnect();
api.close();
fakeRp.close();
