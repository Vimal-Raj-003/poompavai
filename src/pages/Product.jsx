import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import FrameDoll from '../components/FrameDoll.jsx';
import { HERO_FRAMES } from '../lib/frames.js';
import { Availability, BuyButtons, PriceTag, QtyStepper } from '../components/ProductBits.jsx';
import { Divider, Icon } from '../components/Ornament.jsx';
import { L } from '../lib/format.js';
import { setPageMeta } from '../lib/meta.js';

export default function Product() {
  const { slug } = useParams();
  const { t, lang, products, config } = useApp();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const p = useMemo(() => products?.find((x) => x.slug === slug), [products, slug]);

  useEffect(() => { setQty(1); setImgIdx(0); }, [slug]);
  useEffect(() => {
    if (!p) return;
    return setPageMeta({
      title: `${L(p.name, lang)} — POOMPAVAI | Thanjavur Thalaiyatti Bommai`,
      description: `${L(p.shortDesc, lang)} ₹${p.offerPrice ?? p.price}.`,
      image: p.images[0]?.url,
    });
  }, [p, lang]);

  if (products === null) return <div className="wrap section"><p className="hint">{t('common.loading')}</p></div>;
  if (!p) {
    return (
      <div className="wrap section center">
        <p>{t('p.notFound')}</p>
        <Link to="/#collection" className="btn btn--maroon">{t('acct.startShopping')}</Link>
      </div>
    );
  }

  const own = p.animation; // product-specific frame set, when the owner has supplied one
  const manifest = own ? { ...own, base: own.base } : HERO_FRAMES;
  const hint = config.deliveryRange || { min: 3, max: 6 };
  const others = products.filter((x) => x.id !== p.id);
  const img = p.images[imgIdx];

  return (
    <article className="pd">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">{t('nav.home')}</Link> / <Link to="/#collection">{t('nav.collection')}</Link> / <span>{L(p.name, lang)}</span>
        </nav>
        <div className="pd__grid">
          <div className="pd__media">
            <div className="pd__stage">
              <div className="arch arch--lg">
                {own ? (
                  <FrameDoll manifest={manifest} label={L(p.name, lang)} />
                ) : (
                  img && <img src={img.url} alt={L(img.alt, lang) || L(p.name, lang)} width="560" height="896" decoding="async" fetchPriority="high" />
                )}
              </div>
              {!own && (
                <figure className="pd__inset" aria-label={t('p.movement')}>
                  <div className="pd__insetframe"><FrameDoll manifest={manifest} label={t('p.movement')} /></div>
                  <figcaption>{t('p.movement')}</figcaption>
                </figure>
              )}
            </div>
            {!own && <p className="hint pd__note"><Icon name="nod" size={18} /> {t('p.movementNote')}</p>}
            {p.images.length > 1 && (
              <div className="thumbs">
                {p.images.map((im, i) => (
                  <button key={im.url} type="button" className={i === imgIdx ? 'is-on' : ''} onClick={() => setImgIdx(i)} aria-label={`${L(p.name, lang)} ${i + 1}`}>
                    <img src={im.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pd__info">
            <Availability p={p} />
            <h1>{L(p.name, lang)}</h1>
            <PriceTag p={p} />
            <p className="lead">{L(p.shortDesc, lang)}</p>

            <dl className="specs specs--key">
              {p.heightCm && <div><dt>{t('p.size')}</dt><dd>{t('p.height', { n: p.heightCm })}</dd></div>}
              {L(p.material, lang) && <div><dt>{t('p.material')}</dt><dd>{L(p.material, lang)}</dd></div>}
            </dl>

            <div className="pd__buy">
              <div className="pd__qty">
                <span className="lbl">{t('p.qty')}</span>
                <QtyStepper value={qty} onChange={setQty} max={Math.max(1, Math.min(10, p.stock))} />
              </div>
              <BuyButtons p={p} qty={qty} />
            </div>

            <dl className="specs specs--table">
              {p.weightGrams && <div><dt>{t('p.weight')}</dt><dd>{t('p.grams', { n: p.weightGrams })}</dd></div>}
              {L(p.craftsmanship, lang) && <div><dt>{t('p.craft')}</dt><dd>{L(p.craftsmanship, lang)}</dd></div>}
              {L(p.care, lang) && <div><dt>{t('p.care')}</dt><dd>{L(p.care, lang)}</dd></div>}
              <div><dt>{t('p.delivery')}</dt><dd>{t('p.deliveryText', hint)}</dd></div>
              <div><dt>{t('p.returns')}</dt><dd>{t('p.returnsText')} <Link to="/info/refund">→</Link></dd></div>
            </dl>
          </div>
        </div>

        {L(p.story, lang) && (
          <section className="pd__story">
            <Divider />
            <h2>{t('p.story')}</h2>
            <p>{L(p.story, lang)}</p>
          </section>
        )}

        {others.length > 0 && (
          <section className="pd__more">
            <h2>{t('p.moreDolls')}</h2>
            <div className="minigrid">
              {others.map((o) => (
                <Link key={o.id} to={`/product/${o.slug}`} className="mini">
                  <span className="mini__img"><img src={o.images[0]?.url.replace('.webp', '-sm.webp')} alt="" loading="lazy" /></span>
                  <span className="mini__name">{L(o.name, lang)}</span>
                  <span className="price">₹{(o.offerPrice ?? o.price).toLocaleString('en-IN')}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
