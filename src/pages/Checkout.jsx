import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { api } from '../lib/api.js';
import { IN_STATES } from '../lib/geo.js';
import { loadRazorpay } from '../lib/razorpay.js';
import { fmtDate, L, rupees } from '../lib/format.js';
import { Icon } from '../components/Ornament.jsx';

const EMPTY = { fullName: '', mobile: '', line1: '', line2: '', landmark: '', city: '', district: '', state: 'Tamil Nadu', pincode: '', country: 'India' };
const mobileOk = (v) => /^(\+?91|0)?[6-9]\d{9}$/.test(v.replace(/[\s\-()]/g, '')) || /^\+\d{8,15}$/.test(v.replace(/[\s\-()]/g, ''));

export function AddressForm({ value, onChange, errors = {} }) {
  const { t } = useApp();
  const f = (k) => ({
    id: `a-${k}`, className: 'input', value: value[k] ?? '', 'aria-invalid': !!errors[k],
    onChange: (e) => onChange({ ...value, [k]: e.target.value }),
  });
  const field = (k, label, extra = {}, opt = false) => (
    <div className="field">
      <label htmlFor={`a-${k}`}>{label}{opt && <span className="opt"> ({t('common.optional')})</span>}</label>
      <input {...f(k)} {...extra} />
      {errors[k] && <span className="err">{errors[k]}</span>}
    </div>
  );
  const india = (value.country || '').trim().toLowerCase() === 'india';
  return (
    <div>
      <div className="row2">
        {field('fullName', t('co.fullName'), { autoComplete: 'name' })}
        {field('mobile', t('co.mobile'), { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
      </div>
      {field('line1', t('co.line1'), { autoComplete: 'address-line1' })}
      {field('line2', t('co.line2'), { autoComplete: 'address-line2' })}
      {field('landmark', t('co.landmark').replace(/\s*\(.*\)/, ''), {}, true)}
      <div className="row2">
        {field('city', t('co.city'), { autoComplete: 'address-level2' })}
        {field('district', t('co.district'))}
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="a-state">{t('co.state')}</label>
          {india ? (
            <select {...f('state')} autoComplete="address-level1">{IN_STATES.map((s) => <option key={s}>{s}</option>)}</select>
          ) : <input {...f('state')} autoComplete="address-level1" />}
          {errors.state && <span className="err">{errors.state}</span>}
        </div>
        {field('pincode', t('co.pincode'), { inputMode: 'numeric', autoComplete: 'postal-code' })}
      </div>
      {field('country', t('co.country'), { autoComplete: 'country-name' })}
    </div>
  );
}

export default function Checkout() {
  const { t, lang, auth, products, cartLines, setNext, getBuyNow, clearBuyNow, clearCart, errText, notify } = useApp();
  const [sp] = useSearchParams();
  const buyMode = sp.get('buy') === '1';
  const nav = useNavigate();

  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(null);
  const [choice, setChoice] = useState('new'); // saved address id | 'new'
  const [form, setForm] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [saveIt, setSaveIt] = useState(true);
  const [est, setEst] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pending = useRef(null);

  // Sign-in is required only at this point, never for browsing. The purchase is restored afterwards.
  useEffect(() => {
    if (auth.ready && !auth.customer) { setNext(`/checkout${buyMode ? '?buy=1' : ''}`); nav('/signin', { replace: true }); }
  }, [auth.ready, auth.customer, buyMode]);

  const lines = useMemo(() => {
    if (!products) return [];
    if (buyMode) {
      const b = getBuyNow();
      const p = b && products.find((x) => x.id === b.productId);
      return p ? [{ product: p, quantity: Math.max(1, Math.min(10, b.qty || 1)), unit: p.offerPrice ?? p.price }] : [];
    }
    return cartLines;
  }, [products, buyMode, cartLines, getBuyNow]);

  useEffect(() => {
    if (!auth.customer) return;
    api('/addresses').then((d) => {
      setSaved(d.addresses);
      if (d.addresses.length) setChoice(d.addresses.find((a) => a.isDefault)?.id || d.addresses[0].id);
      else setForm((f) => ({ ...f, fullName: auth.customer.fullName, mobile: auth.customer.mobile || '' }));
    }).catch(() => setSaved([]));
  }, [auth.customer?.id]);

  const chosen = choice === 'new' ? form : saved?.find((a) => a.id === choice);
  const subtotal = lines.reduce((s, l) => s + l.unit * l.quantity, 0);
  const fee = est?.shippable ? est.fee : 0;

  const validate = () => {
    const e = {};
    if (form.fullName.trim().length < 2) e.fullName = t('auth.nameInvalid');
    if (!mobileOk(form.mobile)) e.mobile = t('auth.mobileInvalid');
    for (const k of ['line1', 'line2', 'city', 'district', 'state']) if (!form[k].trim()) e[k] = '•';
    const india = form.country.trim().toLowerCase() === 'india';
    if (india ? !/^[1-9]\d{5}$/.test(form.pincode.trim()) : form.pincode.trim().length < 3) e.pincode = t('co.pincode');
    if (!form.country.trim()) e.country = '•';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const toSummary = async () => {
    setErr('');
    if (choice === 'new' && !validate()) return;
    setBusy(true);
    try {
      const a = chosen;
      setEst(await api(`/delivery/estimate?state=${encodeURIComponent(a.state)}&country=${encodeURIComponent(a.country)}`));
      pending.current = null; // address changed -> a fresh order is needed
      setStep(2);
      window.scrollTo({ top: 0 });
    } catch (x) { setErr(errText(x)); }
    setBusy(false);
  };

  const pay = async () => {
    setErr(''); setBusy(true);
    try {
      if (!pending.current) {
        const body = { items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })) };
        if (choice === 'new') { body.address = { ...form, fullName: form.fullName.trim(), mobile: form.mobile.trim() }; body.saveAddress = saveIt; } else body.addressId = choice;
        pending.current = await api('/orders', { method: 'POST', body });
      }
      const { order, razorpay } = pending.current;
      const Razorpay = await loadRazorpay();
      const done = (async (r) => {
        setStep(3);
        try {
          await api(`/orders/${order.id}/verify`, { method: 'POST', body: { razorpay_order_id: r.razorpay_order_id, razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature } });
          if (buyMode) clearBuyNow(); else clearCart();
          nav(`/order/${order.id}/confirmation`, { replace: true });
        } catch (x) {
          // Payment may still succeed via the webhook; send the customer to the status page rather than leaving them stuck.
          nav(`/order/${order.id}/confirmation`, { replace: true });
        }
      });
      const rzp = new Razorpay({
        key: razorpay.keyId,
        order_id: razorpay.orderId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: 'POOMPAVAI',
        description: order.orderNumber,
        prefill: razorpay.prefill,
        theme: { color: '#5a1414' },
        handler: done,
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on('payment.failed', (r) => {
        api(`/orders/${order.id}/failed`, { method: 'POST', body: { reason: r?.error?.description || 'Payment failed' } }).catch(() => {});
        pending.current = null;
        setErr(t('co.payFailed'));
        setBusy(false);
      });
      rzp.open();
    } catch (x) {
      if (x?.code === 'PRODUCT_UNAVAILABLE' || x?.code === 'OUT_OF_STOCK') setErr(x.message);
      else setErr(x?.message === 'razorpay' ? t('common.offline') : errText(x));
      pending.current = null;
      setBusy(false);
    }
  };

  if (!auth.ready || !auth.customer || products === null || saved === null) return <div className="wrap section"><p className="hint">{t('common.loading')}</p></div>;
  if (!lines.length) {
    return <div className="wrap section center"><p>{t('co.noItems')}</p><Link to="/#collection" className="btn btn--maroon">{t('acct.startShopping')}</Link></div>;
  }

  const steps = [t('co.step1'), t('co.step2'), t('co.step3')];
  const a = chosen;
  return (
    <div className="wrap section checkout">
      <h1>{t('co.title')}</h1>
      <ol className="steps" aria-label="Progress">
        {steps.map((s, i) => <li key={s} className={step === i + 1 ? 'is-on' : step > i + 1 ? 'is-done' : ''}><span>{step > i + 1 ? <Icon name="check" size={16} /> : i + 1}</span>{s}</li>)}
      </ol>

      <div className="cartgrid">
        <div>
          {step === 1 && (
            <section className="card">
              <h2>{t('co.addrTitle')}</h2>
              {saved.length > 0 && (
                <div className="addrpick" role="radiogroup" aria-label={t('co.useSaved')}>
                  {saved.map((s) => (
                    <label key={s.id} className={`addrcard ${choice === s.id ? 'is-on' : ''}`}>
                      <input type="radio" name="addr" checked={choice === s.id} onChange={() => setChoice(s.id)} />
                      <span><strong>{s.fullName}</strong> · {s.mobile}<br />{s.line1}, {s.line2}{s.landmark ? `, ${s.landmark}` : ''}<br />{s.city}, {s.district}, {s.state} {s.pincode}, {s.country}</span>
                    </label>
                  ))}
                  <label className={`addrcard ${choice === 'new' ? 'is-on' : ''}`}>
                    <input type="radio" name="addr" checked={choice === 'new'} onChange={() => setChoice('new')} />
                    <span><strong>{t('co.addNew')}</strong></span>
                  </label>
                </div>
              )}
              {choice === 'new' && (
                <>
                  <AddressForm value={form} onChange={setForm} errors={errs} />
                  <label className="check"><input type="checkbox" checked={saveIt} onChange={(e) => setSaveIt(e.target.checked)} /> {t('co.saveAddress')}</label>
                </>
              )}
              {err && <p className="alert alert--err" role="alert">{err}</p>}
              <button type="button" className="btn btn--gold btn--block" disabled={busy} onClick={toSummary}>{t('co.deliverHere')}</button>
            </section>
          )}

          {step >= 2 && (
            <section className="card">
              <h2>{t('co.deliveringTo')} <button type="button" className="linkbtn linkbtn--sm" disabled={step === 3} onClick={() => { setStep(1); pending.current = null; }}>{t('co.edit')}</button></h2>
              <p className="addrline"><strong>{a.fullName}</strong> · {a.mobile}<br />{a.line1}, {a.line2}{a.landmark ? `, ${a.landmark}` : ''}<br />{a.city}, {a.district}, {a.state} {a.pincode}, {a.country}</p>
              {est?.shippable ? (
                <div className="eta">
                  <Icon name="truck" size={22} />
                  <div>
                    <strong>{t('co.estimateText', { min: est.minDays, max: est.maxDays })}</strong>
                    <div className="hint">{t('co.estimateDates', { from: fmtDate(est.from, lang), to: fmtDate(est.to, lang) })}</div>
                  </div>
                </div>
              ) : <p className="alert alert--err">{t('co.notShippable')}</p>}
            </section>
          )}

          {step >= 2 && (
            <section className="card">
              <h2>{t('co.summary')}</h2>
              <ul className="sumlist">
                {lines.map((l) => (
                  <li key={l.product.id}>
                    <img src={l.product.images[0]?.url.replace('.webp', '-sm.webp')} alt="" />
                    <span>{L(l.product.name, lang)} × {l.quantity}</span>
                    <strong>{rupees(l.unit * l.quantity)}</strong>
                  </li>
                ))}
              </ul>
              {err && <p className="alert alert--err" role="alert">{err}</p>}
              {step === 3 && <p className="alert alert--info">{t('co.verifying')}</p>}
              <button type="button" className="btn btn--gold btn--block" disabled={busy || !est?.shippable || step === 3} onClick={pay}>
                <Icon name="lock" size={20} /> {t('co.pay')} · {rupees(subtotal + fee)}
              </button>
              <p className="hint center">{t('co.payNote')}</p>
            </section>
          )}
        </div>

        <aside className="summary">
          <h2>{t('co.items')}</h2>
          <dl>
            <div><dt>{t('cart.subtotal')}</dt><dd>{rupees(subtotal)}</dd></div>
            <div><dt>{t('cart.shipping')}</dt><dd>{est ? (fee ? rupees(fee) : t('cart.free')) : <span className="hint">{t('cart.shippingLater')}</span>}</dd></div>
            <div className="summary__total"><dt>{t('cart.total')}</dt><dd>{rupees(subtotal + fee)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
