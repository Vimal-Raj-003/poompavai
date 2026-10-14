import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { api } from '../lib/api.js';
import { fmtDate, L, rupees } from '../lib/format.js';
import { Divider, Icon } from '../components/Ornament.jsx';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { t, lang, auth, errText } = useApp();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (auth.ready && !auth.customer) nav('/signin', { replace: true });
  }, [auth.ready, auth.customer]);

  // The webhook can settle a payment a little after the browser returns; poll briefly while unpaid.
  useEffect(() => {
    if (!auth.customer) return;
    let stop = false;
    let tries = 0;
    const load = async () => {
      try {
        const d = await api(`/orders/${id}`);
        if (stop) return;
        setOrder(d.order);
        if (d.order.status === 'AWAITING_PAYMENT' && tries++ < 12) setTimeout(load, 4000);
      } catch (e) { if (!stop) setErr(errText(e)); }
    };
    load();
    return () => { stop = true; };
  }, [id, auth.customer?.id]);

  if (err) return <div className="wrap section center"><p className="alert alert--err">{err}</p></div>;
  if (!order) return <div className="wrap section"><p className="hint">{t('common.loading')}</p></div>;

  const paid = order.status !== 'AWAITING_PAYMENT';
  const a = order.address;
  return (
    <div className="wrap wrap--narrow section confirm">
      <div className="confirm__head">
        <span className="confirm__seal"><Icon name={paid ? 'check' : 'clock'} size={34} /></span>
        <h1>{paid ? t('oc.title') : t('co.verifying')}</h1>
        <p className="lead">{paid ? t('oc.thanks') : t('oc.pending')}</p>
      </div>
      <Divider icon="gopuram" />
      <div className="card">
        <dl className="kv">
          <div><dt>{t('oc.orderId')}</dt><dd><strong>{order.orderNumber}</strong></dd></div>
          {order.items.map((i) => (
            <div key={i.productId}><dt>{t('oc.product')}</dt><dd>{L(i.name, lang)} <span className="hint">× {i.quantity}</span></dd></div>
          ))}
          <div><dt>{t('oc.amount')}</dt><dd><strong>{rupees(order.total)}</strong></dd></div>
          <div><dt>{t('oc.address')}</dt><dd>{a.fullName}, {a.line1}, {a.line2}{a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.district}, {a.state} {a.pincode}, {a.country}</dd></div>
          {order.estimatedFrom && <div><dt>{t('oc.eta')}</dt><dd>{fmtDate(order.estimatedFrom, lang)} – {fmtDate(order.estimatedTo, lang)}</dd></div>}
        </dl>
      </div>
      <div className="center confirm__btns">
        <Link to={`/account/orders/${order.id}`} className="btn btn--gold">{t('oc.trackBtn')}</Link>
        <Link to="/#collection" className="btn btn--ghost">{t('cart.continue')}</Link>
      </div>
    </div>
  );
}
