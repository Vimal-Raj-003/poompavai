import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { api } from '../lib/api.js';
import { PAGES } from '../i18n/pages.js';
import { CHAT } from '../i18n/chat.js';
import { SITE, waLink } from '../lib/site.js';
import { Divider, Icon } from '../components/Ornament.jsx';

const IDX = { ta: 0, en: 1, ml: 2 };

export function InfoPage() {
  const { topic } = useParams();
  const { lang, t } = useApp();
  const page = PAGES[topic];
  if (!page) return <NotFound />;
  const i = IDX[lang];
  return (
    <div className="wrap wrap--narrow section prose">
      <h1>{page.title[i]}</h1>
      <Divider />
      {page.sections.map((s) => (
        <section key={s.h[1]}>
          <h2>{s.h[i]}</h2>
          <p>{s.p[i]}</p>
        </section>
      ))}
      {(topic === 'heritage' || topic === 'craftsmanship') && <p><Link to="/#collection" className="btn btn--maroon">{t('hero.cta1')}</Link></p>}
    </div>
  );
}

export function Faq() {
  const { lang, t } = useApp();
  const i = IDX[lang];
  return (
    <div className="wrap wrap--narrow section prose">
      <h1>{t('pg.faq')}</h1>
      <Divider />
      <div className="faq">
        {CHAT.map((c) => (
          <details key={c.q[1]}>
            <summary>{c.q[i]}</summary>
            <p>{c.a[i]}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function Contact() {
  const { t, errText } = useApp();
  const [f, setF] = useState({ name: '', contact: '', message: '' });
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setState('busy');
    try { await api('/contact', { method: 'POST', body: f }); setState('sent'); setF({ name: '', contact: '', message: '' }); } catch (x) { setErr(errText(x)); setState('idle'); }
  };
  return (
    <div className="wrap section contactpage">
      <header className="center">
        <h1>{t('ct.title')}</h1>
        <p className="lead">{t('ct.sub')}</p>
        <Divider />
      </header>
      <div className="contactgrid">
        <div className="card contactinfo">
          <ul>
            <li><Icon name="phone" /> <div><strong>{t('ct.phone')}</strong><a href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a></div></li>
            <li><Icon name="whatsapp" /> <div><strong>{t('ct.whatsapp')}</strong><a href={waLink()} target="_blank" rel="noopener noreferrer">{SITE.phone}</a></div></li>
            <li><Icon name="mail" /> <div><strong>{t('ct.email')}</strong><a href={`mailto:${SITE.email}`}>{SITE.email}</a></div></li>
            <li><Icon name="clock" /> <div><strong>{t('ct.hours')}</strong><span>{t('ct.hoursText')}</span></div></li>
          </ul>
        </div>
        <form className="card" onSubmit={submit}>
          <h2>{t('ct.formTitle')}</h2>
          {state === 'sent' && <p className="alert alert--ok" role="status">{t('ct.sent')}</p>}
          <div className="field"><label htmlFor="cn">{t('ct.name')}</label><input id="cn" className="input" required maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></div>
          <div className="field"><label htmlFor="cc">{t('ct.contact')}</label><input id="cc" className="input" required maxLength={150} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></div>
          <div className="field"><label htmlFor="cmsg">{t('ct.message')}</label><textarea id="cmsg" className="input" required maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
          {err && <p className="alert alert--err" role="alert">{err}</p>}
          <button className="btn btn--maroon" disabled={state === 'busy'}>{t('ct.send')}</button>
        </form>
      </div>
    </div>
  );
}

export function NotFound() {
  const { t } = useApp();
  return (
    <div className="wrap section center">
      <h1>404</h1>
      <p>{t('pg.notFound')}</p>
      <Link to="/" className="btn btn--maroon">{t('pg.goHome')}</Link>
    </div>
  );
}
