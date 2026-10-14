import { db } from '../lib/db.js';
import { getAdminEmail, requireAdmin } from '../lib/auth.js';
import { badRequest, conflict, notFound } from '../lib/http.js';
import { DEFAULT_DELIVERY, getDeliverySettings } from '../lib/delivery.js';
import { orderOut, productAdmin } from '../lib/serialize.js';
import { int, i18n, str } from '../lib/validate.js';

const TZ = 'Asia/Kolkata';
const productInclude = { assets: true };
const orderInclude = { items: true, payments: true, events: true, customer: true };

async function audit(email, action, entity, entityId, detail) {
  await db.adminAuditLog.create({ data: { actorEmail: email, action, entity, entityId, detail: detail ?? undefined } });
}

export async function adminMe({ req }) {
  return { isSuperAdmin: Boolean(await getAdminEmail(req)) };
}

// ---------- dashboard (real data only) ----------
export async function summary({ req }) {
  await requireAdmin(req);
  const paid = { status: 'PAID' };
  const [rev, todayRev, totalOrders, ordersToday, paidOrders, pending, failed, customers, activeProducts, lowStock, payStatus, trend, growth, sales] = await Promise.all([
    db.payment.aggregate({ where: paid, _sum: { amount: true } }),
    db.$queryRaw`SELECT COALESCE(SUM("amount"),0)::int AS v FROM "Payment" WHERE "status"='PAID' AND ("paidAt" AT TIME ZONE ${TZ})::date = (now() AT TIME ZONE ${TZ})::date`,
    db.order.count({ where: { status: { not: 'AWAITING_PAYMENT' } } }),
    db.$queryRaw`SELECT COUNT(*)::int AS v FROM "Order" WHERE "status"<>'AWAITING_PAYMENT' AND ("createdAt" AT TIME ZONE ${TZ})::date = (now() AT TIME ZONE ${TZ})::date`,
    db.payment.count({ where: paid }),
    db.order.count({ where: { status: 'AWAITING_PAYMENT', payments: { none: { status: 'FAILED' } } } }),
    db.payment.count({ where: { status: 'FAILED' } }),
    db.customer.count(),
    db.product.count({ where: { status: 'ACTIVE' } }),
    db.$queryRaw`SELECT COUNT(*)::int AS v FROM "Product" WHERE "status"='ACTIVE' AND "stock" <= "lowStockAt"`,
    db.payment.groupBy({ by: ['status'], _count: { _all: true } }),
    db.$queryRaw`
      SELECT to_char(d::date,'YYYY-MM-DD') AS date,
             COALESCE(SUM(p."amount"),0)::int AS revenue, COUNT(p."id")::int AS orders
      FROM generate_series((now() AT TIME ZONE ${TZ})::date - 29, (now() AT TIME ZONE ${TZ})::date, interval '1 day') d
      LEFT JOIN "Payment" p ON p."status"='PAID' AND (p."paidAt" AT TIME ZONE ${TZ})::date = d::date
      GROUP BY d ORDER BY d`,
    db.$queryRaw`
      SELECT to_char(d::date,'YYYY-MM-DD') AS date, COUNT(c."id")::int AS signups,
             (SELECT COUNT(*) FROM "Customer" WHERE ("createdAt" AT TIME ZONE ${TZ})::date <= d::date)::int AS total
      FROM generate_series((now() AT TIME ZONE ${TZ})::date - 29, (now() AT TIME ZONE ${TZ})::date, interval '1 day') d
      LEFT JOIN "Customer" c ON (c."createdAt" AT TIME ZONE ${TZ})::date = d::date
      GROUP BY d ORDER BY d`,
    db.$queryRaw`
      SELECT oi."productId", MAX(oi."name"->>'en') AS name, SUM(oi."quantity")::int AS units, SUM(oi."quantity" * oi."unitPrice")::int AS revenue
      FROM "OrderItem" oi JOIN "Payment" p ON p."orderId" = oi."orderId" AND p."status"='PAID'
      GROUP BY oi."productId" ORDER BY units DESC`,
  ]);
  return {
    cards: {
      totalRevenue: rev._sum.amount || 0,
      todayRevenue: todayRev[0].v,
      totalOrders,
      ordersToday: ordersToday[0].v,
      paidOrders,
      pendingPayments: pending,
      failedPayments: failed,
      totalCustomers: customers,
      activeProducts,
      lowStock: lowStock[0].v,
    },
    charts: {
      revenueTrend: trend,
      productSales: sales,
      paymentStatus: payStatus.map((s) => ({ status: s.status, count: s._count._all })),
      customerGrowth: growth,
    },
  };
}

// ---------- products ----------
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const urlOk = (u) => typeof u === 'string' && u.length < 600 && (/^\/[^/\\]/.test(u) || /^https:\/\//.test(u));

function productData(b) {
  const price = int(b.price, { min: 1, max: 1_000_000, label: 'Price' });
  const offerPrice = b.offerPrice === null || b.offerPrice === '' || b.offerPrice === undefined ? null : int(b.offerPrice, { min: 1, max: 1_000_000, label: 'Offer price' });
  if (offerPrice !== null && offerPrice >= price) throw badRequest('Offer price must be lower than the price', 'VALIDATION');
  const status = ['ACTIVE', 'DISABLED', 'ARCHIVED'].includes(b.status) ? b.status : 'ACTIVE';
  return {
    name: i18n(b.name, 'Name', { max: 160 }),
    shortDesc: i18n(b.shortDesc, 'Short description', { max: 400 }),
    story: i18n(b.story, 'Story', { max: 2000, required: false }),
    material: i18n(b.material, 'Material', { max: 200, required: false }),
    craftsmanship: i18n(b.craftsmanship, 'Craftsmanship', { max: 1000, required: false }),
    care: i18n(b.care, 'Care', { max: 1000, required: false }),
    heightCm: b.heightCm ? int(b.heightCm, { min: 1, max: 300, label: 'Height' }) : null,
    weightGrams: b.weightGrams ? int(b.weightGrams, { min: 1, max: 50000, label: 'Weight' }) : null,
    price,
    offerPrice,
    stock: int(b.stock ?? 0, { min: 0, max: 100000, label: 'Stock' }),
    lowStockAt: int(b.lowStockAt ?? 3, { min: 0, max: 1000, label: 'Low-stock level' }),
    status,
    featured: Boolean(b.featured),
    sortOrder: int(b.sortOrder ?? 0, { min: 0, max: 10000, label: 'Sort order' }),
  };
}

function assetRows(b) {
  const rows = [];
  (Array.isArray(b.images) ? b.images : []).slice(0, 12).forEach((im, i) => {
    if (!urlOk(im?.url)) throw badRequest('Image address must start with / or https://', 'VALIDATION');
    rows.push({ kind: 'IMAGE', url: im.url, alt: im.alt && typeof im.alt === 'object' ? im.alt : undefined, sortOrder: i });
  });
  const a = b.animation;
  if (a && typeof a === 'object' && a.base) {
    if (!urlOk(a.base)) throw badRequest('Animation folder must start with / or https://', 'VALIDATION');
    const meta = {
      base: a.base.replace(/\/$/, ''),
      pattern: str(a.pattern || 'f{n}.webp', { max: 60 }),
      count: int(a.count, { min: 2, max: 400, label: 'Frame count' }),
      pad: int(a.pad ?? 3, { min: 0, max: 6 }),
      width: int(a.width, { min: 50, max: 4000 }),
      height: int(a.height, { min: 50, max: 4000 }),
      fps: int(a.fps ?? 12, { min: 1, max: 30 }),
    };
    rows.push({ kind: 'FRAME_SEQUENCE', url: meta.base, meta, sortOrder: 100 });
  }
  return rows;
}

export async function adminListProducts({ req }) {
  await requireAdmin(req);
  const rows = await db.product.findMany({ include: productInclude, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  return { products: rows.map(productAdmin) };
}

export async function adminCreateProduct({ req, body }) {
  const email = await requireAdmin(req);
  const data = productData(body);
  const slug = slugify(body.slug || data.name.en);
  if (!slug) throw badRequest('Product needs a name', 'VALIDATION');
  if (await db.product.findUnique({ where: { slug } })) throw conflict('Another product already uses this web address', 'SLUG_EXISTS');
  const p = await db.product.create({ data: { ...data, slug, assets: { create: assetRows(body) } }, include: productInclude });
  await audit(email, 'product.create', 'Product', p.id, { slug });
  return { product: productAdmin(p) };
}

export async function adminUpdateProduct({ req, body, params }) {
  const email = await requireAdmin(req);
  const cur = await db.product.findUnique({ where: { id: params.id } });
  if (!cur) throw notFound('Product not found');
  const data = productData(body);
  let slug = cur.slug;
  if (body.slug && slugify(body.slug) !== cur.slug) {
    slug = slugify(body.slug);
    if (await db.product.findUnique({ where: { slug } })) throw conflict('Another product already uses this web address', 'SLUG_EXISTS');
  }
  const p = await db.$transaction(async (tx) => {
    await tx.productAsset.deleteMany({ where: { productId: cur.id } });
    return tx.product.update({ where: { id: cur.id }, data: { ...data, slug, assets: { create: assetRows(body) } }, include: productInclude });
  });
  await audit(email, 'product.update', 'Product', p.id, { slug, status: p.status });
  return { product: productAdmin(p) };
}

// Products with orders are archived, never hard-deleted.
export async function adminArchiveProduct({ req, params }) {
  const email = await requireAdmin(req);
  const p = await db.product.update({ where: { id: params.id }, data: { status: 'ARCHIVED' }, include: productInclude }).catch(() => null);
  if (!p) throw notFound('Product not found');
  await audit(email, 'product.archive', 'Product', p.id);
  return { product: productAdmin(p) };
}

// ---------- orders ----------
export async function adminListOrders({ req, query }) {
  await requireAdmin(req);
  const status = query.get('status');
  const rows = await db.order.findMany({
    where: status ? { status } : undefined,
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  return { orders: rows.map((o) => orderOut(o, { admin: true })) };
}

const ADMIN_STATUSES = ['PREPARING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export async function adminUpdateOrder({ req, body, params }) {
  const email = await requireAdmin(req);
  const o = await db.order.findUnique({ where: { id: params.id }, include: { payments: true } });
  if (!o) throw notFound('Order not found');
  const data = {};
  for (const k of ['courierName', 'trackingNumber', 'trackingUrl']) {
    if (body[k] !== undefined) {
      const v = body[k] === null || body[k] === '' ? null : str(body[k], { max: 300, label: k });
      if (k === 'trackingUrl' && v && !/^https?:\/\//i.test(v)) throw badRequest('Tracking link must start with http:// or https://', 'VALIDATION');
      data[k] = v;
    }
  }
  let event = null;
  if (body.status) {
    if (!ADMIN_STATUSES.includes(body.status)) throw badRequest('Invalid status', 'VALIDATION');
    const paid = o.payments.some((p) => p.status === 'PAID');
    if (body.status !== 'CANCELLED' && !paid) throw conflict('This order has not been paid yet', 'NOT_PAID');
    if (o.status === 'DELIVERED' || o.status === 'CANCELLED') throw conflict('This order is already closed', 'CLOSED');
    data.status = body.status;
    event = { orderId: o.id, status: body.status, note: body.note ? str(body.note, { max: 300 }) : null, byAdmin: true };
  }
  const updated = await db.$transaction(async (tx) => {
    if (event) await tx.orderTrackingEvent.create({ data: event });
    return tx.order.update({ where: { id: o.id }, data, include: orderInclude });
  });
  await audit(email, 'order.update', 'Order', o.id, { status: body.status, courier: data.courierName });
  return { order: orderOut(updated, { admin: true }) };
}

// ---------- payments / customers ----------
export async function adminPayments({ req }) {
  await requireAdmin(req);
  const rows = await db.payment.findMany({ include: { order: { include: { customer: true } } }, orderBy: { createdAt: 'desc' }, take: 300 });
  return {
    payments: rows.map((p) => ({
      id: p.id,
      orderNumber: p.order.orderNumber,
      customer: p.order.customer.fullName,
      amount: p.amount,
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      status: p.status,
      failureReason: p.failureReason,
      date: p.paidAt || p.createdAt,
    })),
  };
}

export async function adminCustomers({ req }) {
  await requireAdmin(req);
  const rows = await db.customer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true, fullName: true, mobile: true, email: true, age: true, preferredLanguage: true, createdAt: true,
      orders: { where: { payments: { some: { status: 'PAID' } } }, select: { total: true, createdAt: true } },
    },
  });
  return {
    customers: rows.map(({ orders, ...c }) => ({
      ...c,
      totalOrders: orders.length,
      totalSpend: orders.reduce((s, o) => s + o.total, 0),
      lastOrder: orders.length ? orders.reduce((m, o) => (o.createdAt > m ? o.createdAt : m), orders[0].createdAt) : null,
    })),
  };
}

// ---------- delivery settings ----------
export async function adminGetDelivery({ req }) {
  await requireAdmin(req);
  return { settings: await getDeliverySettings(), defaults: DEFAULT_DELIVERY };
}

const zone = (z) => ({
  name: str(z.name, { max: 60, label: 'Zone name' }),
  ...(Array.isArray(z.states) ? { states: z.states.slice(0, 40).map((s) => str(s, { max: 60 })) } : {}),
  minDays: int(z.minDays, { min: 0, max: 60, label: 'Minimum days' }),
  maxDays: int(z.maxDays, { min: 0, max: 90, label: 'Maximum days' }),
  fee: int(z.fee ?? 0, { min: 0, max: 100000, label: 'Shipping fee' }),
});

export async function adminPutDelivery({ req, body }) {
  const email = await requireAdmin(req);
  const value = {
    processingDays: int(body.processingDays, { min: 0, max: 60, label: 'Processing days' }),
    defaultZone: zone(body.defaultZone || {}),
    zones: (Array.isArray(body.zones) ? body.zones : []).slice(0, 20).map(zone),
    international: { enabled: Boolean(body.international?.enabled), ...zone({ name: 'International', ...(body.international || {}), minDays: body.international?.minDays ?? 10, maxDays: body.international?.maxDays ?? 15 }) },
  };
  delete value.international.name;
  for (const z of [value.defaultZone, ...value.zones, value.international]) if (z.maxDays < z.minDays) throw badRequest('Maximum days cannot be less than minimum days', 'VALIDATION');
  await db.setting.upsert({ where: { key: 'delivery' }, update: { value }, create: { key: 'delivery', value } });
  await audit(email, 'settings.delivery', 'Setting', 'delivery');
  return { settings: value };
}
