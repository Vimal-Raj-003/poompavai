import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { QtyStepper } from '../components/ProductBits.jsx';
import { L, rupees } from '../lib/format.js';

export default function Cart() {
  const { t, lang, cartLines, cartSubtotal, setQty, removeFromCart, auth, setNext, clearBuyNow, config } = useApp();
  const nav = useNavigate();

  const checkout = () => {
    clearBuyNow();
    if (!auth.customer) { setNext('/checkout'); nav('/signin'); } else nav('/checkout');
  };

  return (
    <div className="wrap section cartpage">
      <h1>{t('cart.title')}</h1>
      {cartLines.length === 0 ? (
        <div className="empty">
          <p>{t('cart.empty')}</p>
          <Link to="/#collection" className="btn btn--maroon">{t('acct.startShopping')}</Link>
        </div>
      ) : (
        <div className="cartgrid">
          <ul className="cartlist">
            {cartLines.map(({ product: p, quantity, unit }) => (
              <li key={p.id} className="cartitem">
                <Link to={`/product/${p.slug}`} className="cartitem__img"><img src={p.images[0]?.url.replace('.webp', '-sm.webp')} alt={L(p.name, lang)} loading="lazy" /></Link>
                <div className="cartitem__body">
                  <Link to={`/product/${p.slug}`} className="cartitem__name">{L(p.name, lang)}</Link>
                  <span className="hint">{t('cart.unit')}: {rupees(unit)}</span>
                  <div className="cartitem__row">
                    <QtyStepper value={quantity} onChange={(q) => setQty(p.id, q)} max={Math.min(config.maxQty || 10, Math.max(1, p.stock))} />
                    <strong className="price price--sm">{rupees(unit * quantity)}</strong>
                  </div>
                  <button type="button" className="linkbtn" onClick={() => removeFromCart(p.id)}>{t('common.remove')}</button>
                </div>
              </li>
            ))}
          </ul>
          <aside className="summary">
            <dl>
              <div><dt>{t('cart.subtotal')}</dt><dd>{rupees(cartSubtotal)}</dd></div>
              <div><dt>{t('cart.shipping')}</dt><dd className="hint">{t('cart.shippingLater')}</dd></div>
              <div className="summary__total"><dt>{t('cart.total')}</dt><dd>{rupees(cartSubtotal)}</dd></div>
            </dl>
            <button type="button" className="btn btn--gold btn--block" onClick={checkout}>{t('cart.checkout')}</button>
            <Link to="/#collection" className="btn btn--ghost btn--block">{t('cart.continue')}</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
