import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { discountPct, L, rupees } from '../lib/format.js';
import { copyText, productUrl, shareLinks } from '../lib/share.js';
import { Icon } from './Ornament.jsx';

export function Availability({ p }) {
  const { t } = useApp();
  if (p.availability === 'OUT_OF_STOCK') return <span className="badge badge--off">{t('p.outOfStock')}</span>;
  if (p.availability === 'LOW_STOCK') return <span className="badge badge--warn">{t('p.lowStock', { n: p.stock })}</span>;
  return <span className="badge badge--ok">{t('p.inStock')}</span>;
}

export function PriceTag({ p }) {
  const { t } = useApp();
  return (
    <div className="pricerow">
      <span className="price">{rupees(p.offerPrice ?? p.price)}{p.offerPrice && <s>{rupees(p.price)}</s>}</span>
      {p.offerPrice && <span className="badge badge--warn">{t('p.save', { n: discountPct(p) })}</span>}
    </div>
  );
}

export function QtyStepper({ value, onChange, max = 10, min = 1 }) {
  const { t } = useApp();
  return (
    <div className="qty">
      <button type="button" aria-label={t('cart.decrease')} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={t('cart.increase')} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

// Add to Cart / Buy Now / Share. Buy Now remembers the purchase so sign-in returns to it.
export function BuyButtons({ p, qty = 1, compact = false }) {
  const { t, addToCart, notify, auth, setBuyNow, setNext } = useApp();
  const nav = useNavigate();
  const out = p.availability === 'OUT_OF_STOCK';
  const buyNow = () => {
    setBuyNow({ productId: p.id, qty });
    if (!auth.customer) {
      setNext('/checkout?buy=1');
      nav('/signin');
    } else nav('/checkout?buy=1');
  };
  return (
    <div className={`buybtns ${compact ? 'buybtns--compact' : ''}`}>
      <button type="button" className="btn btn--maroon" disabled={out} onClick={() => { addToCart(p.id, qty); notify(t('p.added')); }}>
        <Icon name="cart" size={20} /> {t('p.addToCart')}
      </button>
      <button type="button" className="btn btn--gold" disabled={out} onClick={buyNow}>{t('p.buyNow')}</button>
      <ShareMenu p={p} />
    </div>
  );
}

export function ShareMenu({ p }) {
  const { t, lang, notify } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, []);

  const url = productUrl(p.slug);
  const text = `${L(p.name, lang)} — ${t('share.text')}`;
  const links = shareLinks(url, text);
  const canNative = typeof navigator !== 'undefined' && !!navigator.share;
  const preferNative = canNative && window.matchMedia?.('(pointer: coarse)').matches; // phones/tablets: system share sheet first

  const copy = async (msg) => { if (await copyText(url)) notify(msg); setOpen(false); };
  const native = async () => {
    try { await navigator.share({ title: `POOMPAVAI — ${L(p.name, lang)}`, text, url }); } catch { /* cancelled */ }
    setOpen(false);
  };

  return (
    <div className="sharemenu" ref={ref}>
      <button type="button" className="btn btn--ghost" aria-haspopup="true" aria-expanded={open} onClick={() => (preferNative ? native() : setOpen(!open))}>
        <Icon name="share" size={20} /> {t('p.share')}
      </button>
      {open && (
        <div className="sharemenu__panel" role="menu" aria-label={t('share.title')}>
          <a role="menuitem" href={links.whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><Icon name="whatsapp" size={20} /> {t('share.whatsapp')}</a>
          <a role="menuitem" href={links.facebook} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}><Icon name="facebook" size={20} /> {t('share.facebook')}</a>
          <button type="button" role="menuitem" onClick={() => copy(t('share.igHint'))}><Icon name="instagram" size={20} /> {t('share.instagram')}</button>
          <a role="menuitem" href={links.sms} onClick={() => setOpen(false)}><Icon name="chat" size={20} /> {t('share.sms')}</a>
          <button type="button" role="menuitem" onClick={() => copy(t('share.copied'))}><Icon name="check" size={20} /> {t('share.copy')}</button>
          {canNative && <button type="button" role="menuitem" onClick={native}><Icon name="share" size={20} /> {t('share.native')}</button>}
        </div>
      )}
    </div>
  );
}
