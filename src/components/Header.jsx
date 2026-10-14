import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { Icon, Logo } from './Ornament.jsx';

const LANGS = [
  { id: 'ta', label: 'தமிழ்', name: 'தமிழ்' },
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'ml', label: 'മലയാളം', name: 'മലയാളം' },
];

export function LangSwitch({ light = false }) {
  const { lang, setLang, t } = useApp();
  return (
    <div className={`langsw ${light ? 'langsw--light' : ''}`} role="group" aria-label={t('common.language')}>
      {LANGS.map((l) => (
        <button key={l.id} type="button" className={lang === l.id ? 'is-on' : ''} aria-pressed={lang === l.id} onClick={() => setLang(l.id)} lang={l.id} title={l.name}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

function AccountMenu() {
  const { auth, t, logout } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!auth.customer) {
    return (
      <div className="hdr__auth">
        <Link to="/signin" className="hdr__link">{t('nav.signin')}</Link>
        <Link to="/signup" className="btn btn--gold btn--sm">{t('nav.signup')}</Link>
      </div>
    );
  }
  const first = auth.customer.fullName.split(' ')[0];
  return (
    <div className="acctmenu" ref={ref}>
      <button type="button" className="hdr__iconbtn acctmenu__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="user" /> <span className="acctmenu__name">{first}</span>
      </button>
      {open && (
        <div className="acctmenu__panel" role="menu">
          <Link to="/account" role="menuitem">{t('acct.profile')}</Link>
          <Link to="/account/orders" role="menuitem">{t('acct.orders')}</Link>
          <Link to="/account/track" role="menuitem">{t('acct.track')}</Link>
          <Link to="/account/addresses" role="menuitem">{t('acct.addresses')}</Link>
          <Link to="/cart" role="menuitem">{t('acct.cart')}</Link>
          {/* Shown only when the server has verified the Super Admin Google identity. */}
          {auth.isSuperAdmin && <Link to="/admin" role="menuitem" className="acctmenu__admin">{t('nav.admin')}</Link>}
          <button type="button" role="menuitem" onClick={async () => { await logout(); setOpen(false); nav('/'); }}>{t('auth.logout')}</button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { t, cartCount } = useApp();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => setMenu(false), [loc.pathname, loc.hash]);
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  const links = [
    ['/', 'nav.home'],
    ['/#story', 'nav.story'],
    ['/#collection', 'nav.collection'],
    ['/#why', 'nav.why'],
    ['/contact', 'nav.contact'],
  ];

  return (
    <header className="hdr">
      <div className="hdr__bar wrap">
        <button type="button" className="hdr__iconbtn hdr__burger" aria-label={t('nav.menu')} aria-expanded={menu} onClick={() => setMenu(!menu)}>
          <Icon name={menu ? 'close' : 'menu'} size={26} />
        </button>
        <Link to="/" className="hdr__logo" aria-label="POOMPAVAI"><Logo light /></Link>
        <nav className="hdr__nav" aria-label="Main">
          {links.map(([to, k]) => <NavLink key={k} to={to} end className="hdr__link">{t(k)}</NavLink>)}
        </nav>
        <div className="hdr__right">
          <LangSwitch light />
          <div className="hdr__acct"><AccountMenu /></div>
          <Link to="/cart" className="hdr__iconbtn hdr__cart" aria-label={`${t('nav.cart')} (${cartCount})`}>
            <Icon name="cart" size={24} />
            {cartCount > 0 && <span className="hdr__count">{cartCount}</span>}
          </Link>
        </div>
      </div>
      {menu && (
        <div className="drawer" onClick={() => setMenu(false)}>
          <nav className="drawer__panel" onClick={(e) => e.stopPropagation()} aria-label="Menu">
            {links.map(([to, k]) => <Link key={k} to={to}>{t(k)}</Link>)}
            <MobileAuth />
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileAuth() {
  const { auth, t, logout } = useApp();
  const nav = useNavigate();
  if (!auth.customer) {
    return (
      <div className="drawer__auth">
        <Link to="/signin" className="btn btn--ghost-light">{t('nav.signin')}</Link>
        <Link to="/signup" className="btn btn--gold">{t('nav.signup')}</Link>
      </div>
    );
  }
  return (
    <div className="drawer__acct">
      <Link to="/account">{t('acct.profile')}</Link>
      <Link to="/account/orders">{t('acct.orders')}</Link>
      <Link to="/account/track">{t('acct.track')}</Link>
      <Link to="/account/addresses">{t('acct.addresses')}</Link>
      {auth.isSuperAdmin && <Link to="/admin">{t('nav.admin')}</Link>}
      <button type="button" onClick={async () => { await logout(); nav('/'); }}>{t('auth.logout')}</button>
    </div>
  );
}
