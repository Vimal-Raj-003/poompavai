import { Link } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { SITE, waLink } from '../lib/site.js';
import { Icon, Logo } from './Ornament.jsx';

export default function Footer() {
  const { t } = useApp();
  const col = (title, items) => (
    <div className="ftr__col">
      <h3>{title}</h3>
      <ul>{items.map(([to, label]) => <li key={label}><Link to={to}>{label}</Link></li>)}</ul>
    </div>
  );
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr__top">
          <div className="ftr__brand">
            <Logo light />
            <p>{t('ft.tag')}</p>
            <div className="ftr__social" aria-label={t('ft.social')}>
              <a href={waLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Icon name="whatsapp" /></a>
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Icon name="instagram" /></a>
              <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Icon name="facebook" /></a>
            </div>
          </div>
          {col(t('ft.shop'), [['/#collection', t('nav.collection')], ['/#collection', t('ft.newArrivals')], ['/#collection', t('ft.bestSellers')]])}
          {col(t('ft.care'), [['/contact', t('ft.contact')], ['/info/shipping', t('ft.shipping')], ['/account/track', t('ft.tracking')], ['/info/refund', t('ft.returns')], ['/faq', t('ft.faq')]])}
          {col(t('ft.account'), [['/signin', t('nav.signin')], ['/signup', t('nav.signup')], ['/account/orders', t('acct.orders')], ['/account/track', t('acct.track')]])}
          {col(t('ft.about'), [['/#story', t('nav.story')], ['/info/heritage', t('ft.heritage')], ['/info/craftsmanship', t('ft.craft')]])}
          {col(t('ft.legal'), [['/info/privacy', t('ft.privacy')], ['/info/terms', t('ft.terms')], ['/info/shipping', t('ft.shippingPolicy')], ['/info/cancellation', t('ft.cancellation')], ['/info/refund', t('ft.refund')]])}
        </div>
        <div className="ftr__bottom">
          <span>{t('ft.rights', { year: new Date().getFullYear() })}</span>
          <span className="ftr__secure"><Icon name="lock" size={16} /> {t('ft.secure')}</span>
        </div>
      </div>
    </footer>
  );
}
