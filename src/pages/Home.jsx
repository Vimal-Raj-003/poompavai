import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import FrameDoll from '../components/FrameDoll.jsx';
import { HERO_FRAMES } from '../lib/frames.js';
import { Divider, Icon, Lotus } from '../components/Ornament.jsx';
import { Availability, BuyButtons, PriceTag, QtyStepper } from '../components/ProductBits.jsx';
import { L } from '../lib/format.js';

function Hero() {
  const { t } = useApp();
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* Static temple art. No animation, zoom or parallax. */}
      <div className="hero__temple">
        <img src="/temple.webp" alt="" width="736" height="1104" fetchPriority="high" decoding="async" />
      </div>
      <div className="hero__doll">
        <div className="nicheframe">
          <FrameDoll manifest={HERO_FRAMES} label={t('hero.caption')} />
        </div>
        <p className="hero__caption"><Lotus /> {t('hero.caption')}</p>
      </div>
      <div className="hero__copy">
        <span className="hero__brand">POOMPAVAI</span>
        <span className="hero__eyebrow">{t('hero.eyebrow')}</span>
        <h1 id="hero-title">{t('hero.title')}</h1>
        <p className="hero__sub">{t('hero.sub')}</p>
        <div className="hero__cta">
          <button type="button" className="btn btn--gold" onClick={() => go('collection')}>{t('hero.cta1')}</button>
          <button type="button" className="btn btn--ghost-light" onClick={() => go('story')}>{t('hero.cta2')}</button>
        </div>
      </div>
    </section>
  );
}

function Story() {
  const { t } = useApp();
  return (
    <section className="section section--sand" id="story">
      <div className="wrap story">
        <div className="story__text">
          <span className="kicker">{t('story.kicker')}</span>
          <h2 className="h-xl">{t('story.title')}</h2>
          <Divider />
          <p>{t('story.p1')}</p>
          <p>{t('story.p2')}</p>
          <p>{t('story.p3')}</p>
          <ul className="tags">
            {['1', '2', '3', '4'].map((n) => <li key={n}>{t(`story.tag${n}`)}</li>)}
          </ul>
        </div>
        <figure className="story__art">
          <div className="story__img"><img src="/temple.webp" alt="" loading="lazy" width="736" height="1104" /></div>
          <figcaption><Icon name="nod" size={22} /> {t('story.movement')}</figcaption>
        </figure>
      </div>
    </section>
  );
}

// One full-viewport editorial screen per product (image and details alternate sides).
function DollRow({ p, i }) {
  const { lang, t } = useApp();
  const [qty, setQty] = useState(1);
  const img = p.images[0];
  return (
    <article className={`doll ${i % 2 ? 'doll--flip' : ''}`} aria-label={L(p.name, lang)}>
      <div className="wrap doll__in">
        <div className="doll__media">
          <span className="doll__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          <Link to={`/product/${p.slug}`} className="arch arch--lg" aria-label={L(p.name, lang)}>
            {img && <img src={img.url} alt={L(img.alt, lang) || L(p.name, lang)} loading={i === 0 ? 'eager' : 'lazy'} width="560" height="896" decoding="async" />}
          </Link>
        </div>
        <div className="doll__info">
          <Availability p={p} />
          <h3><Link to={`/product/${p.slug}`}>{L(p.name, lang)}</Link></h3>
          <PriceTag p={p} />
          <p className="doll__desc">{L(p.shortDesc, lang)}</p>
          <dl className="specs specs--key">
            {p.heightCm && <div><dt>{t('p.size')}</dt><dd>{t('p.height', { n: p.heightCm })}</dd></div>}
            {L(p.material, lang) && <div><dt>{t('p.material')}</dt><dd>{L(p.material, lang)}</dd></div>}
          </dl>
          {L(p.story, lang) && <blockquote className="doll__story">{L(p.story, lang)}</blockquote>}
          <div className="pd__qty">
            <span className="lbl">{t('p.qty')}</span>
            <QtyStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(10, p.stock))} />
          </div>
          <BuyButtons p={p} qty={qty} />
          <Link to={`/product/${p.slug}`} className="doll__more">{t('col.view')} →</Link>
        </div>
      </div>
    </article>
  );
}

function Collection() {
  const { t, products } = useApp();
  return (
    <section className="collection" id="collection">
      <div className="wrap">
        <header className="center collection__head">
          <span className="kicker">{t('col.kicker')}</span>
          <h2 className="h-xl">{t('col.title')}</h2>
          <p className="lead">{t('col.sub')}</p>
          <Divider icon="gopuram" />
        </header>
        {products === null && <p className="center hint">{t('common.loading')}</p>}
        {products?.length === 0 && <p className="center hint">{t('col.empty')}</p>}
      </div>
      <div className="dolls">{products?.map((p, i) => <DollRow key={p.id} p={p} i={i} />)}</div>
    </section>
  );
}

function Why() {
  const { t } = useApp();
  const icons = ['hand', 'nod', 'seal', 'gift', 'box', 'lock', 'truck'];
  return (
    <section className="section section--dark" id="why">
      <div className="wrap">
        <header className="center">
          <span className="kicker">{t('why.kicker')}</span>
          <h2 className="h-xl">{t('why.title')}</h2>
          <Divider />
        </header>
        <ul className="why">
          {icons.map((ic, i) => (
            <li key={ic}>
              <span className="why__ico"><Icon name={ic} size={28} /></span>
              <h3>{t(`why.${i + 1}.t`)}</h3>
              <p>{t(`why.${i + 1}.d`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AccountBand() {
  const { t, auth } = useApp();
  const nav = useNavigate();
  return (
    <section className="band">
      <div className="wrap band__in">
        {auth.customer ? (
          <>
            <div>
              <h2>{t('band.hello', { name: auth.customer.fullName.split(' ')[0] })}</h2>
              <p>{t('band.helloSub')}</p>
            </div>
            <button type="button" className="btn btn--gold" onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}>{t('hero.cta1')}</button>
          </>
        ) : (
          <>
            <div>
              <h2>{t('band.title')}</h2>
              <p>{t('band.sub')}</p>
            </div>
            <div className="band__btns">
              <button type="button" className="btn btn--gold" onClick={() => nav('/signup')}>{t('nav.signup')}</button>
              <button type="button" className="btn btn--ghost-light" onClick={() => nav('/signin')}>{t('nav.signin')}</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Story />
      <AccountBand />
      <Collection />
      <Why />
    </>
  );
}
