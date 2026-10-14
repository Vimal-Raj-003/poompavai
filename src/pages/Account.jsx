import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { api } from '../lib/api.js';
import { fmtDate, L, rupees } from '../lib/format.js';
import Tracker from '../components/Tracker.jsx';
import { AddressForm } from './Checkout.jsx';
import { Icon } from '../components/Ornament.jsx';

function Profile() {
  const { t, auth, onAuthenticated, notify, errText, lang, setLang } = useApp();
  const c = auth.customer;
  const [f, setF] = useState({ fullName: c.fullName, age: c.age ?? '', language: c.preferredLanguage });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await api('/account/profile', { method: 'PATCH', body: { fullName: f.fullName, age: f.age === '' ? undefined : Number(f.age), language: f.language } });
      onAuthenticated({ customer: r.customer, isSuperAdmin: auth.isSuperAdmin });
      if (f.language !== lang) setLang(f.language);
      notify(t('acct.saved'));
    } catch (x) { setErr(errText(x)); }
    setBusy(false);
  };

  return (
    <div className="stack">
      <form className="card" onSubmit={save} noValidate>
        <h2>{t('acct.profile')}</h2>
        <div className="field"><label htmlFor="pn">{t('auth.fullName')}</label><input id="pn" className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></div>
        <div className="row2">
          <div className="field"><label htmlFor="pa">{t('auth.age')}</label><input id="pa" className="input" type="number" min="13" max="110" value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })} /></div>
          <div className="field"><label htmlFor="pl2">{t('auth.prefLang')}</label>
            <select id="pl2" className="input" value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}><option value="ta">தமிழ்</option><option value="en">English</option><option value="ml">മലയാളം</option></select>
          </div>
        </div>
        <div className="field"><span className="lbl">{t('auth.mobile')}</span><div className="static">{c.mobile || '—'}</div></div>
        {err && <p className="alert alert--err">{err}</p>}
        <button className="btn btn--maroon" disabled={busy}>{t('common.save')}</button>
      </form>
      <EmailCard />
      {!c.hasPassword && <MobileCard />}
    </div>
  );
}

function EmailCard() {
  const { t, auth, onAuthenticated, notify, errText, lang } = useApp();
  const c = auth.customer;
  const [email, setEmail] = useState(c.email || '');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api('/account/email/request', { method: 'POST', body: { email } }); setSent(true); } catch (x) { setErr(errText(x)); }
    setBusy(false);
  };
  const verify = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await api('/account/email/verify', { method: 'POST', body: { email, code } });
      onAuthenticated({ customer: r.customer, isSuperAdmin: auth.isSuperAdmin });
      setSent(false); setCode(''); notify(t('acct.saved'));
    } catch (x) { setErr(errText(x)); }
    setBusy(false);
  };

  return (
    <div className="card">
      <h2>{t('auth.email')} {c.emailVerified && <span className="badge badge--ok">{t('acct.emailVerified')}</span>}</h2>
      {!c.emailVerified && <p className="hint">{t('acct.addEmailHint')}</p>}
      {sent ? (
        <form onSubmit={verify}>
          <p className="alert alert--info">{t('auth.codeSent', { email })}</p>
          <div className="field"><label htmlFor="vc">{t('auth.code')}</label><input id="vc" className="input input--code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></div>
          {err && <p className="alert alert--err">{err}</p>}
          <button className="btn btn--maroon" disabled={busy || code.length !== 6}>{t('auth.verify')}</button>
        </form>
      ) : (
        <form onSubmit={send}>
          <div className="field"><label htmlFor="em">{t('auth.email')}</label><input id="em" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {err && <p className="alert alert--err">{err}</p>}
          <button className="btn btn--ghost" disabled={busy || !email}>{c.emailVerified ? t('auth.sendCode') : t('acct.addEmail')}</button>
        </form>
      )}
    </div>
  );
}

function MobileCard() {
  const { t, auth, onAuthenticated, notify, errText } = useApp();
  const [f, setF] = useState({ mobile: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      const r = await api('/account/credentials', { method: 'POST', body: f });
      onAuthenticated({ customer: r.customer, isSuperAdmin: auth.isSuperAdmin });
      notify(t('acct.saved'));
    } catch (x) { setErr(errText(x)); }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>{t('acct.addMobile')}</h2>
      <p className="hint">{t('acct.addMobileHint')}</p>
      <div className="field"><label htmlFor="cm">{t('auth.mobile')}</label><input id="cm" className="input" type="tel" value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} /></div>
      <div className="field"><label htmlFor="cp">{t('auth.createPassword')}</label><input id="cp" className="input" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><span className="hint">{t('auth.passwordHint')}</span></div>
      {err && <p className="alert alert--err">{err}</p>}
      <button className="btn btn--maroon">{t('common.save')}</button>
    </form>
  );
}

function useOrders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => { api('/orders').then((d) => setOrders(d.orders)).catch(() => setOrders([])); }, []);
  return orders;
}

function Orders() {
  const { t, lang } = useApp();
  const orders = useOrders();
  if (!orders) return <p className="hint">{t('common.loading')}</p>;
  if (!orders.length) return <div className="empty card"><p>{t('acct.noOrders')}</p><Link to="/#collection" className="btn btn--maroon">{t('acct.startShopping')}</Link></div>;
  return (
    <ul className="orderlist">
      {orders.map((o) => (
        <li key={o.id} className="card">
          <div className="orderlist__top">
            <div><strong>{o.orderNumber}</strong><div className="hint">{fmtDate(o.createdAt, lang)}</div></div>
            <span className={`badge ${o.status === 'DELIVERED' ? 'badge--ok' : o.status === 'CANCELLED' ? 'badge--off' : ''}`}>{t(`trk.${o.status}`)}</span>
          </div>
          <ul className="sumlist">
            {o.items.map((i) => (
              <li key={i.productId}><img src={i.imageUrl?.replace('.webp', '-sm.webp')} alt="" /><span>{L(i.name, lang)} × {i.quantity}</span></li>
            ))}
          </ul>
          <div className="orderlist__foot"><strong>{rupees(o.total)}</strong><Link to={`/account/orders/${o.id}`} className="btn btn--ghost btn--sm">{t('oc.trackBtn')}</Link></div>
        </li>
      ))}
    </ul>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const { t, lang, errText } = useApp();
  const [o, setO] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api(`/orders/${id}`).then((d) => setO(d.order)).catch((e) => setErr(errText(e))); }, [id]);
  if (err) return <p className="alert alert--err">{err}</p>;
  if (!o) return <p className="hint">{t('common.loading')}</p>;
  const a = o.address;
  return (
    <div className="stack">
      <div className="card">
        <h2>{t('trk.title')} · {o.orderNumber}</h2>
        <Tracker order={o} />
      </div>
      <div className="card">
        <dl className="kv">
          {o.items.map((i) => <div key={i.productId}><dt>{t('oc.product')}</dt><dd>{L(i.name, lang)} × {i.quantity} · {rupees(i.unitPrice * i.quantity)}</dd></div>)}
          <div><dt>{t('oc.amount')}</dt><dd><strong>{rupees(o.total)}</strong></dd></div>
          <div><dt>{t('oc.address')}</dt><dd>{a.fullName}, {a.line1}, {a.line2}, {a.city}, {a.district}, {a.state} {a.pincode}</dd></div>
          {o.estimatedFrom && <div><dt>{t('oc.eta')}</dt><dd>{fmtDate(o.estimatedFrom, lang)} – {fmtDate(o.estimatedTo, lang)}</dd></div>}
        </dl>
      </div>
      <Link to="/account/orders" className="linkbtn">← {t('acct.orders')}</Link>
    </div>
  );
}

function TrackLatest() {
  const { t, lang } = useApp();
  const orders = useOrders();
  const [sel, setSel] = useState(null);
  useEffect(() => { if (orders?.length && !sel) setSel(orders[0].id); }, [orders]);
  if (!orders) return <p className="hint">{t('common.loading')}</p>;
  if (!orders.length) return <div className="empty card"><p>{t('acct.noOrders')}</p></div>;
  const o = orders.find((x) => x.id === sel) || orders[0];
  return (
    <div className="stack">
      {orders.length > 1 && (
        <div className="field"><label htmlFor="so">{t('trk.pickOrder')}</label>
          <select id="so" className="input" value={o.id} onChange={(e) => setSel(e.target.value)}>
            {orders.map((x) => <option key={x.id} value={x.id}>{x.orderNumber} · {fmtDate(x.createdAt, lang)}</option>)}
          </select>
        </div>
      )}
      <div className="card"><h2>{o.orderNumber}</h2><Tracker order={o} /></div>
    </div>
  );
}

function Addresses() {
  const { t, errText, notify } = useApp();
  const [list, setList] = useState(null);
  const [edit, setEdit] = useState(null); // null | 'new' | address
  const [form, setForm] = useState({});
  const [err, setErr] = useState('');
  const load = () => api('/addresses').then((d) => setList(d.addresses)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  const open = (a) => { setEdit(a); setForm(a === 'new' ? { fullName: '', mobile: '', line1: '', line2: '', landmark: '', city: '', district: '', state: 'Tamil Nadu', pincode: '', country: 'India' } : a); setErr(''); };
  const save = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (edit === 'new') await api('/addresses', { method: 'POST', body: form });
      else await api(`/addresses/${edit.id}`, { method: 'PUT', body: form });
      setEdit(null); notify(t('acct.saved')); load();
    } catch (x) { setErr(errText(x)); }
  };
  const makeDefault = async (a) => { await api(`/addresses/${a.id}`, { method: 'PUT', body: { ...a, isDefault: true } }); load(); };
  const del = async (a) => { await api(`/addresses/${a.id}`, { method: 'DELETE' }); load(); };

  if (!list) return <p className="hint">{t('common.loading')}</p>;
  if (edit) {
    return (
      <form className="card" onSubmit={save}>
        <h2>{t('acct.addresses')}</h2>
        <AddressForm value={form} onChange={setForm} />
        {err && <p className="alert alert--err">{err}</p>}
        <div className="btnrow"><button className="btn btn--maroon">{t('common.save')}</button><button type="button" className="btn btn--ghost" onClick={() => setEdit(null)}>{t('common.cancel')}</button></div>
      </form>
    );
  }
  return (
    <div className="stack">
      {list.length === 0 && <p className="hint">{t('acct.noAddresses')}</p>}
      {list.map((a) => (
        <div key={a.id} className="card">
          {a.isDefault && <span className="badge badge--ok">{t('acct.default')}</span>}
          <p className="addrline"><strong>{a.fullName}</strong> · {a.mobile}<br />{a.line1}, {a.line2}{a.landmark ? `, ${a.landmark}` : ''}<br />{a.city}, {a.district}, {a.state} {a.pincode}, {a.country}</p>
          <div className="btnrow">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => open(a)}>{t('common.edit')}</button>
            {!a.isDefault && <button type="button" className="btn btn--ghost btn--sm" onClick={() => makeDefault(a)}>{t('acct.makeDefault')}</button>}
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => del(a)}>{t('common.delete')}</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn--maroon" onClick={() => open('new')}>{t('acct.addNew')}</button>
    </div>
  );
}

export default function Account() {
  const { t, auth, logout } = useApp();
  const nav = useNavigate();
  useEffect(() => { if (auth.ready && !auth.customer) nav('/signin', { replace: true }); }, [auth.ready, auth.customer]);
  if (!auth.customer) return <div className="wrap section"><p className="hint">{t('common.loading')}</p></div>;
  const tabs = [['/account', t('acct.profile'), true], ['/account/orders', t('acct.orders')], ['/account/track', t('acct.track')], ['/account/addresses', t('acct.addresses')], ['/cart', t('acct.cart')]];
  return (
    <div className="wrap section accountpage">
      <h1>{t('acct.title')}</h1>
      <div className="accountgrid">
        <nav className="subnav" aria-label={t('acct.title')}>
          {tabs.map(([to, label, end]) => <NavLink key={to} to={to} end={!!end}>{label}</NavLink>)}
          <button type="button" onClick={async () => { await logout(); nav('/'); }}>{t('auth.logout')}</button>
        </nav>
        <div>
          <Routes>
            <Route index element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="track" element={<TrackLatest />} />
            <Route path="addresses" element={<Addresses />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
