export const effectivePrice = (p) => (p.offerPrice != null && p.offerPrice < p.price ? p.offerPrice : p.price);

export function availability(p) {
  if (p.stock <= 0) return 'OUT_OF_STOCK';
  if (p.stock <= p.lowStockAt) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export function productPublic(p) {
  const assets = [...(p.assets || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDesc: p.shortDesc,
    story: p.story,
    material: p.material,
    craftsmanship: p.craftsmanship,
    care: p.care,
    heightCm: p.heightCm,
    weightGrams: p.weightGrams,
    price: p.price,
    offerPrice: p.offerPrice != null && p.offerPrice < p.price ? p.offerPrice : null,
    stock: Math.max(0, p.stock),
    availability: availability(p),
    featured: p.featured,
    images: assets.filter((a) => a.kind === 'IMAGE').map((a) => ({ url: a.url, alt: a.alt })),
    animation: assets.find((a) => a.kind === 'FRAME_SEQUENCE')?.meta || null,
  };
}

export function productAdmin(p) {
  return {
    ...productPublic(p),
    stock: p.stock,
    lowStockAt: p.lowStockAt,
    status: p.status,
    sortOrder: p.sortOrder,
    assets: [...(p.assets || [])].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => ({ id: a.id, kind: a.kind, url: a.url, alt: a.alt, meta: a.meta, sortOrder: a.sortOrder })),
  };
}

export function addressOut(a) {
  return {
    id: a.id,
    fullName: a.fullName,
    mobile: a.mobile,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark,
    city: a.city,
    district: a.district,
    state: a.state,
    pincode: a.pincode,
    country: a.country,
    isDefault: a.isDefault,
  };
}

export function customerOut(c) {
  return {
    id: c.id,
    fullName: c.fullName,
    mobile: c.mobile,
    email: c.email,
    emailVerified: Boolean(c.emailVerifiedAt),
    age: c.age,
    preferredLanguage: c.preferredLanguage,
    hasPassword: Boolean(c.credential),
  };
}

export function orderOut(o, { admin = false } = {}) {
  const payment = [...(o.payments || [])].sort((a, b) => b.createdAt - a.createdAt)[0] || null;
  const base = {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    total: o.total,
    address: o.address,
    estimatedFrom: o.estimatedFrom,
    estimatedTo: o.estimatedTo,
    courierName: o.courierName,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    createdAt: o.createdAt,
    paymentStatus: payment?.status || null,
    items: (o.items || []).map((i) => ({ productId: i.productId, name: i.name, imageUrl: i.imageUrl, unitPrice: i.unitPrice, quantity: i.quantity })),
    events: [...(o.events || [])].sort((a, b) => a.createdAt - b.createdAt).map((e) => ({ status: e.status, note: e.note, at: e.createdAt })),
  };
  if (admin) {
    base.customer = o.customer ? { id: o.customer.id, fullName: o.customer.fullName, mobile: o.customer.mobile, email: o.customer.email } : null;
    base.payment = payment && { id: payment.id, razorpayOrderId: payment.razorpayOrderId, razorpayPaymentId: payment.razorpayPaymentId, status: payment.status, paidAt: payment.paidAt };
  }
  return base;
}
