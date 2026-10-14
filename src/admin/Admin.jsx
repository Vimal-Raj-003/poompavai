import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './admin.css';
import { useApp } from '../state/AppContext.jsx';
import { api } from '../lib/api.js';
import GoogleButton from '../components/GoogleButton.jsx';
import { BarList, ColumnChart, LineChart } from './Charts.jsx';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const dt = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—');
const STATUS_LABEL = { AWAITING_PAYMENT: 'Awaiting payment', PLACED: 'Placed', PAYMENT_CONFIRMED: 'Payment confirmed', PREPARING: 'Preparing', PACKED: 'Packed', SHIPPED: 'Shipped', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };
const Pill = ({ s }) => <span className={`pill pill--${s}`}>{STATUS_LABEL[s] || s}</span>;

function useLoad(path, deps = []) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api(path).then(setData).catch((e) => setErr(e.message)), [path]);
  useEffect(() => { load(); }, [load, ...deps]);
  return { data, err, reload: load };
}

function Dashboard() {
  const { data, err } = useLoad('/admin/summary');
  if (err) return <p className="alert alert--err">{err}</p>;
  if (!data) return <p>Loading…</p>;
  const c = data.cards;
  const cards = [
    ['Total Revenue', money(c.totalRevenue)], ['Today Revenue', money(c.todayRevenue)], ['Total Orders', c.totalOrders], ['Orders Today', c.ordersToday],
    ['Paid Orders', c.paidOrders], ['Pending Payments', c.pendingPayments], ['Failed Payments', c.failedPayments], ['Total Customers', c.totalCustomers],
    ['Active Products', c.activeProducts], ['Low Stock', c.lowStock],
  ];
  const ch = data.charts;
  const payColor = { PAID: '#3d6b3a', CREATED: '#a4502e', FAILED: '#9b2222' };
  const payName = { PAID: 'Paid', CREATED: 'Pending', FAILED: 'Failed' };
  return (
    <>
      <h1>Dashboard</h1>
      <div className="kpis">{cards.map(([k, v]) => <div className="kpi" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
      <div className="charts">
        <ColumnChart data={ch.revenueTrend} x="date" y="revenue" label="Revenue trend" money />
        <ColumnChart data={ch.revenueTrend} x="date" y="orders" label="Orders trend" />
        <BarList label="Product sales (units)" rows={ch.productSales.map((p) => ({ name: p.name, value: p.units }))} />
        <BarList label="Payment status" rows={ch.paymentStatus.map((p) => ({ name: payName[p.status] || p.status, value: p.count, color: payColor[p.status] }))} />
        <LineChart data={ch.customerGrowth} x="date" y="total" label="Customer growth (total customers)" />
      </div>
    </>
  );
}

const LANGS = [['en', 'English'], ['ta', 'தமிழ்'], ['ml', 'മലയാളം']];
const I18N_FIELDS = [['name', 'Name', false], ['shortDesc', 'Short description', true], ['story', 'Heritage story', true], ['material', 'Material', false], ['craftsmanship', 'Craftsmanship', true], ['care', 'Care instructions', true]];
const blank = () => ({
  slug: '', price: '', offerPrice: '', stock: 0, lowStockAt: 3, heightCm: '', weightGrams: '', status: 'ACTIVE', featured: false, sortOrder: 0,
  name: {}, shortDesc: {}, story: {}, material: {}, craftsmanship: {}, care: {}, images: [{ url: '', alt: {} }], animation: null,
});

function ProductForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(() => ({ ...blank(), ...initial, offerPrice: initial?.offerPrice ?? '', heightCm: initial?.heightCm ?? '', weightGrams: initial?.weightGrams ?? '', images: initial?.images?.length ? initial.images : [{ url: '', alt: {} }] }));
  const [err, setErr] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setL = (k, l, v) => setF((s) => ({ ...s, [k]: { ...s[k], [l]: v } }));
  const anim = f.animation;

  const save = async (e) => {
    e.preventDefault(); setErr('');
    const body = {
      ...f,
      price: Number(f.price), offerPrice: f.offerPrice === '' ? null : Number(f.offerPrice),
      stock: Number(f.stock), lowStockAt: Number(f.lowStockAt), sortOrder: Number(f.sortOrder),
      heightCm: f.heightCm === '' ? null : Number(f.heightCm), weightGrams: f.weightGrams === '' ? null : Number(f.weightGrams),
      images: f.images.filter((i) => i.url.trim()),
      animation: anim && anim.base ? { ...anim, count: Number(anim.count), width: Number(anim.width), height: Number(anim.height), fps: Number(anim.fps || 12), pad: Number(anim.pad ?? 3) } : null,
    };
    try {
      if (initial?.id) await api(`/admin/products/${initial.id}`, { method: 'PUT', body });
      else await api('/admin/products', { method: 'POST', body });
      onSaved();
    } catch (x) { setErr(x.message); }
  };

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal__box" onSubmit={save}>
        <h2>{initial?.id ? 'Edit product' : 'Add product'}</h2>
        {I18N_FIELDS.map(([k, label, long]) => (
          <fieldset key={k}><legend>{label}</legend>
            <div className="grid3">
              {LANGS.map(([l, ln]) => (
                <div className="field" key={l}>
                  <label>{ln}{l === 'en' && k === 'name' ? ' *' : ''}</label>
                  {long ? <textarea className="input" rows={3} value={f[k]?.[l] || ''} onChange={(e) => setL(k, l, e.target.value)} lang={l} /> : <input className="input" value={f[k]?.[l] || ''} onChange={(e) => setL(k, l, e.target.value)} lang={l} />}
                </div>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="grid3">
          <div className="field"><label>Price (₹) *</label><input className="input" type="number" min="1" required value={f.price} onChange={(e) => set('price', e.target.value)} /></div>
          <div className="field"><label>Offer price (₹)</label><input className="input" type="number" min="1" value={f.offerPrice} onChange={(e) => set('offerPrice', e.target.value)} /></div>
          <div className="field"><label>Stock</label><input className="input" type="number" min="0" value={f.stock} onChange={(e) => set('stock', e.target.value)} /></div>
          <div className="field"><label>Low-stock level</label><input className="input" type="number" min="0" value={f.lowStockAt} onChange={(e) => set('lowStockAt', e.target.value)} /></div>
          <div className="field"><label>Height (cm)</label><input className="input" type="number" min="1" value={f.heightCm} onChange={(e) => set('heightCm', e.target.value)} /></div>
          <div className="field"><label>Weight (grams)</label><input className="input" type="number" min="1" value={f.weightGrams} onChange={(e) => set('weightGrams', e.target.value)} /></div>
          <div className="field"><label>Sort order</label><input className="input" type="number" min="0" value={f.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></div>
          <div className="field"><label>Status</label><select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">Enabled</option><option value="DISABLED">Disabled</option><option value="ARCHIVED">Archived</option></select></div>
          <div className="field"><label>Web address (slug)</label><input className="input" value={f.slug} placeholder="auto from English name" onChange={(e) => set('slug', e.target.value)} /></div>
        </div>
        <label className="check"><input type="checkbox" checked={f.featured} onChange={(e) => set('featured', e.target.checked)} /> Featured</label>
        <fieldset><legend>Images (first is the main image; start with / or https://)</legend>
          {f.images.map((im, i) => (
            <div className="field" key={i}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="/products/img1.webp" value={im.url} onChange={(e) => set('images', f.images.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                <button type="button" className="btn btn--ghost" onClick={() => set('images', f.images.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn--ghost" onClick={() => set('images', [...f.images, { url: '', alt: {} }])}>+ Add image</button>
          <p className="hint">Images are web paths. Put files in <code>public/products/</code> (or any https URL).</p>
        </fieldset>
        <fieldset><legend>Product animation frames (optional)</legend>
          <p className="hint">If set, this product shows its own head-movement animation instead of the shared studio one.</p>
          <div className="grid3">
            {[['base', 'Folder (e.g. /anim/doll1)'], ['pattern', 'File pattern, e.g. f{n}.webp'], ['count', 'Frame count'], ['pad', 'Number padding'], ['width', 'Width px'], ['height', 'Height px'], ['fps', 'FPS']].map(([k, label]) => (
              <div className="field" key={k}><label>{label}</label><input className="input" value={anim?.[k] ?? ''} onChange={(e) => set('animation', { pattern: 'f{n}.webp', pad: 3, fps: 12, ...anim, [k]: e.target.value })} /></div>
            ))}
          </div>
        </fieldset>
        {err && <p className="alert alert--err">{err}</p>}
        <div className="toolbar"><button className="btn btn--maroon">Save product</button><button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  );
}

function Products() {
  const { data, err, reload } = useLoad('/admin/products');
  const [edit, setEdit] = useState(null);
  if (err) return <p className="alert alert--err">{err}</p>;
  if (!data) return <p>Loading…</p>;
  const archive = async (p) => { if (confirm(`Archive “${p.name.en}”? It will disappear from the shop.`)) { await api(`/admin/products/${p.id}`, { method: 'DELETE' }); reload(); } };
  return (
    <>
      <h1>Products</h1>
      <div className="toolbar"><button className="btn btn--maroon" onClick={() => setEdit({})}>+ Add product</button></div>
      <div className="tablewrap"><table>
        <thead><tr><th>Product</th><th className="num">Price</th><th className="num">Offer</th><th className="num">Stock</th><th>Status</th><th>Featured</th><th className="num">Order</th><th /></tr></thead>
        <tbody>{data.products.map((p) => (
          <tr key={p.id}>
            <td><b>{p.name.en}</b><div className="hint">{p.name.ta} · {p.name.ml}</div><div className="hint">/product/{p.slug}</div></td>
            <td className="num">{money(p.price)}</td><td className="num">{p.offerPrice ? money(p.offerPrice) : '—'}</td>
            <td className="num">{p.stock}</td><td><Pill s={p.status} /></td><td>{p.featured ? 'Yes' : '—'}</td><td className="num">{p.sortOrder}</td>
            <td><button className="linkbtn" onClick={() => setEdit(p)}>Edit</button> · <button className="linkbtn" onClick={() => archive(p)}>Archive</button></td>
          </tr>
        ))}</tbody>
      </table></div>
      {edit && <ProductForm initial={edit.id ? edit : null} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </>
  );
}

const NEXT = ['PREPARING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

function OrderRow({ o, onChange }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ status: '', note: '', courierName: o.courierName || '', trackingNumber: o.trackingNumber || '', trackingUrl: o.trackingUrl || '' });
  const [err, setErr] = useState('');
  const a = o.address;
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api(`/admin/orders/${o.id}`, { method: 'PATCH', body: { ...(f.status ? { status: f.status, note: f.note || undefined } : {}), courierName: f.courierName, trackingNumber: f.trackingNumber, trackingUrl: f.trackingUrl } });
      setF({ ...f, status: '', note: '' }); onChange();
    } catch (x) { setErr(x.message); }
  };
  return (
    <>
      <tr>
        <td><b>{o.orderNumber}</b></td><td>{o.customer?.fullName}<div className="hint">{o.customer?.mobile || o.customer?.email}</div></td>
        <td>{o.items.map((i) => `${i.name.en} × ${i.quantity}`).join(', ')}</td><td className="num">{money(o.total)}</td>
        <td><Pill s={o.paymentStatus || 'CREATED'} /></td><td><Pill s={o.status} /></td><td>{day(o.createdAt)}</td>
        <td>{o.estimatedFrom ? `${day(o.estimatedFrom)} – ${day(o.estimatedTo)}` : '—'}</td><td>{o.courierName || '—'}</td><td>{o.trackingNumber || '—'}</td>
        <td><button className="linkbtn" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Manage'}</button></td>
      </tr>
      {open && (
        <tr className="detail"><td colSpan={11}>
          <p><b>Deliver to:</b> {a.fullName}, {a.mobile} — {a.line1}, {a.line2}{a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.district}, {a.state} {a.pincode}, {a.country}</p>
          <p className="hint">History: {o.events.map((e) => `${STATUS_LABEL[e.status]} (${dt(e.at)})`).join(' → ') || '—'}</p>
          <form onSubmit={save} className="grid3">
            <div className="field"><label>Update status</label><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">— no change —</option>{NEXT.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
            <div className="field"><label>Note (optional)</label><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></div>
            <div className="field"><label>Courier name</label><input className="input" value={f.courierName} onChange={(e) => setF({ ...f, courierName: e.target.value })} /></div>
            <div className="field"><label>Tracking number</label><input className="input" value={f.trackingNumber} onChange={(e) => setF({ ...f, trackingNumber: e.target.value })} /></div>
            <div className="field"><label>Tracking link</label><input className="input" value={f.trackingUrl} onChange={(e) => setF({ ...f, trackingUrl: e.target.value })} /></div>
            <div className="field" style={{ alignSelf: 'end' }}><button className="btn btn--maroon">Save</button></div>
          </form>
          {err && <p className="alert alert--err">{err}</p>}
        </td></tr>
      )}
    </>
  );
}

function Orders() {
  const [status, setStatus] = useState('');
  const { data, err, reload } = useLoad(`/admin/orders${status ? `?status=${status}` : ''}`);
  return (
    <>
      <h1>Orders</h1>
      <div className="toolbar"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      {err && <p className="alert alert--err">{err}</p>}
      {!data ? <p>Loading…</p> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Order</th><th>Customer</th><th>Product</th><th className="num">Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Est. delivery</th><th>Courier</th><th>Tracking #</th><th /></tr></thead>
          <tbody>{data.orders.map((o) => <OrderRow key={o.id} o={o} onChange={reload} />)}</tbody>
        </table>{data.orders.length === 0 && <p style={{ padding: 16 }}>No orders yet.</p>}</div>
      )}
    </>
  );
}

function Payments() {
  const { data, err } = useLoad('/admin/payments');
  if (err) return <p className="alert alert--err">{err}</p>;
  if (!data) return <p>Loading…</p>;
  return (
    <>
      <h1>Payments</h1>
      <div className="tablewrap"><table>
        <thead><tr><th>Order</th><th>Customer</th><th className="num">Amount</th><th>Razorpay order ID</th><th>Razorpay payment ID</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>{data.payments.map((p) => (
          <tr key={p.id}><td>{p.orderNumber}</td><td>{p.customer}</td><td className="num">{money(p.amount)}</td><td>{p.razorpayOrderId}</td><td>{p.razorpayPaymentId || '—'}</td><td><Pill s={p.status} />{p.failureReason && <div className="hint">{p.failureReason}</div>}</td><td>{dt(p.date)}</td></tr>
        ))}</tbody>
      </table>{data.payments.length === 0 && <p style={{ padding: 16 }}>No payments yet.</p>}</div>
    </>
  );
}

function Customers() {
  const { data, err } = useLoad('/admin/customers');
  if (err) return <p className="alert alert--err">{err}</p>;
  if (!data) return <p>Loading…</p>;
  const L = { ta: 'தமிழ்', en: 'English', ml: 'മലയാളം' };
  return (
    <>
      <h1>Customers</h1>
      <div className="tablewrap"><table>
        <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th className="num">Age</th><th>Language</th><th>Joined</th><th className="num">Orders</th><th className="num">Total spend</th><th>Last order</th></tr></thead>
        <tbody>{data.customers.map((c) => (
          <tr key={c.id}><td>{c.fullName}</td><td>{c.mobile || '—'}</td><td>{c.email || '—'}</td><td className="num">{c.age ?? '—'}</td><td>{L[c.preferredLanguage]}</td><td>{day(c.createdAt)}</td><td className="num">{c.totalOrders}</td><td className="num">{money(c.totalSpend)}</td><td>{day(c.lastOrder)}</td></tr>
        ))}</tbody>
      </table>{data.customers.length === 0 && <p style={{ padding: 16 }}>No customers yet.</p>}</div>
    </>
  );
}

function Delivery() {
  const { data, err, reload } = useLoad('/admin/settings/delivery');
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { if (data) setS(JSON.parse(JSON.stringify(data.settings))); }, [data]);
  if (err) return <p className="alert alert--err">{err}</p>;
  if (!s) return <p>Loading…</p>;
  const num = (v) => Number(v) || 0;
  const zone = (z, set, withStates) => (
    <div className="grid3">
      <div className="field"><label>Zone name</label><input className="input" value={z.name} onChange={(e) => set({ ...z, name: e.target.value })} /></div>
      {withStates && <div className="field"><label>States (comma separated)</label><input className="input" value={(z.states || []).join(', ')} onChange={(e) => set({ ...z, states: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></div>}
      <div className="field"><label>Shipping days (min)</label><input className="input" type="number" min="0" value={z.minDays} onChange={(e) => set({ ...z, minDays: num(e.target.value) })} /></div>
      <div className="field"><label>Shipping days (max)</label><input className="input" type="number" min="0" value={z.maxDays} onChange={(e) => set({ ...z, maxDays: num(e.target.value) })} /></div>
      <div className="field"><label>Shipping fee (₹)</label><input className="input" type="number" min="0" value={z.fee} onChange={(e) => set({ ...z, fee: num(e.target.value) })} /></div>
    </div>
  );
  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try { await api('/admin/settings/delivery', { method: 'PUT', body: s }); setMsg('Saved'); reload(); } catch (x) { setMsg(x.message); }
  };
  return (
    <>
      <h1>Delivery settings</h1>
      <form onSubmit={save}>
        <div className="card"><div className="field"><label>Processing days (before dispatch)</label><input className="input" type="number" min="0" value={s.processingDays} onChange={(e) => setS({ ...s, processingDays: num(e.target.value) })} /></div>
          <p className="hint">Estimated delivery shown to customers = processing days + the zone's shipping days (Sundays are skipped).</p></div>
        {s.zones.map((z, i) => (
          <fieldset key={i}><legend>Zone {i + 1}</legend>{zone(z, (nz) => setS({ ...s, zones: s.zones.map((x, j) => (j === i ? nz : x)) }), true)}
            <button type="button" className="linkbtn" onClick={() => setS({ ...s, zones: s.zones.filter((_, j) => j !== i) })}>Remove zone</button></fieldset>
        ))}
        <button type="button" className="btn btn--ghost" onClick={() => setS({ ...s, zones: [...s.zones, { name: 'New zone', states: [], minDays: 2, maxDays: 4, fee: 0 }] })}>+ Add zone</button>
        <fieldset style={{ marginTop: 14 }}><legend>All other Indian states</legend>{zone(s.defaultZone, (z) => setS({ ...s, defaultZone: z }))}</fieldset>
        <fieldset><legend>International</legend>
          <label className="check"><input type="checkbox" checked={!!s.international.enabled} onChange={(e) => setS({ ...s, international: { ...s.international, enabled: e.target.checked } })} /> Accept international orders at checkout</label>
          {zone({ name: 'International', ...s.international }, (z) => setS({ ...s, international: { ...z, enabled: s.international.enabled } }))}
        </fieldset>
        <div className="toolbar"><button className="btn btn--maroon">Save delivery settings</button>{msg && <span>{msg}</span>}</div>
      </form>
    </>
  );
}

const TABS = [['dash', 'Dashboard', Dashboard], ['products', 'Products', Products], ['orders', 'Orders', Orders], ['payments', 'Payments', Payments], ['customers', 'Customers', Customers], ['delivery', 'Delivery', Delivery]];

export default function Admin() {
  const { auth, config, refreshMe, logout } = useApp();
  const [tab, setTab] = useState('dash');
  const [state, setState] = useState('checking'); // checking | yes | no
  const [err, setErr] = useState('');

  const check = useCallback(() => api('/admin/me').then((d) => setState(d.isSuperAdmin ? 'yes' : 'no')).catch(() => setState('no')), []);
  useEffect(() => { check(); }, [check]);

  if (state === 'checking') return <div className="adm__login"><p style={{ color: '#fff' }}>Loading…</p></div>;
  if (state === 'no') {
    return (
      <div className="adm__login">
        <div className="adm__logincard">
          <h1>POOMPAVAI Super Admin</h1>
          <p>Sign in with the authorised Google account.</p>
          <GoogleButton mode="admin" onDone={() => { refreshMe(); check(); }} onError={(e) => setErr(e.status === 403 ? 'This Google account is not authorised for Super Admin.' : e.message)} />
          {!config.googleClientId && <p className="alert alert--err">Google sign-in is not configured (GOOGLE_CLIENT_ID).</p>}
          {err && <p className="alert alert--err" role="alert">{err}</p>}
          <Link to="/">← Back to the shop</Link>
        </div>
      </div>
    );
  }
  const Current = TABS.find((t) => t[0] === tab)[2];
  return (
    <div className="adm">
      <aside className="adm__side">
        <div className="adm__brand">POOMPAVAI</div>
        {TABS.map(([id, label]) => <button key={id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{label}</button>)}
        <span className="spacer" />
        <Link to="/">View shop</Link>
        <button onClick={async () => { await logout(); setState('no'); }}>Log out</button>
      </aside>
      <main className="adm__main"><Current /></main>
    </div>
  );
}
