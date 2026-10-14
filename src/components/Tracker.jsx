import { useApp } from '../state/AppContext.jsx';
import { fmtDateTime } from '../lib/format.js';
import { Icon } from './Ornament.jsx';

export const STAGES = ['PLACED', 'PAYMENT_CONFIRMED', 'PREPARING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

// Seven-stage timeline with the timestamp of every stage that has happened, plus courier details.
export default function Tracker({ order }) {
  const { t, lang } = useApp();
  const at = {};
  for (const e of order.events) if (!at[e.status]) at[e.status] = e.at;
  const cancelled = order.status === 'CANCELLED';
  const currentIdx = Math.max(-1, ...STAGES.map((s, i) => (at[s] ? i : -1)));

  return (
    <div className="tracker">
      <ol>
        {STAGES.map((s, i) => {
          const done = Boolean(at[s]);
          const current = !cancelled && i === currentIdx && s !== 'DELIVERED';
          return (
            <li key={s} className={`${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}>
              <span className="tracker__dot">{done ? <Icon name="check" size={16} /> : ''}</span>
              <div>
                <strong>{t(`trk.${s}`)}</strong>
                {done && <span className="hint"> · {fmtDateTime(at[s], lang)}</span>}
              </div>
            </li>
          );
        })}
        {cancelled && (
          <li className="is-cancel">
            <span className="tracker__dot">×</span>
            <div><strong>{t('trk.CANCELLED')}</strong>{at.CANCELLED && <span className="hint"> · {fmtDateTime(at.CANCELLED, lang)}</span>}</div>
          </li>
        )}
      </ol>
      {(order.courierName || order.trackingNumber) && (
        <dl className="courier">
          {order.courierName && <div><dt>{t('trk.courier')}</dt><dd>{order.courierName}</dd></div>}
          {order.trackingNumber && <div><dt>{t('trk.number')}</dt><dd>{order.trackingNumber}</dd></div>}
          {order.trackingUrl && /^https?:\/\//i.test(order.trackingUrl) && (
            <div><dt /><dd><a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">{t('trk.link')}</a></dd></div>
          )}
        </dl>
      )}
    </div>
  );
}
