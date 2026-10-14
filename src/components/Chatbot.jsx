import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { CHAT } from '../i18n/chat.js';
import { waLink } from '../lib/site.js';
import { Icon, Lotus } from './Ornament.jsx';

const IDX = { ta: 0, en: 1, ml: 2 };

// Rule-based helper: predefined questions only (no AI), in the visitor's language.
export default function Chatbot() {
  const { t, lang } = useApp();
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState([]); // indexes of asked questions
  const bodyRef = useRef(null);
  const i = IDX[lang];

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }); }, [log, open]);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, []);

  return (
    <>
      <button type="button" className="chatfab" aria-expanded={open} aria-controls="chatpanel" onClick={() => setOpen(!open)}>
        <Icon name={open ? 'close' : 'chat'} size={24} /> <span>{t('chat.open')}</span>
      </button>
      {open && (
        <section id="chatpanel" className="chat" role="dialog" aria-label={t('chat.title')}>
          <header className="chat__head">
            <Lotus className="chat__lotus" />
            <strong>{t('chat.title')}</strong>
            <button type="button" aria-label={t('common.close')} onClick={() => setOpen(false)}><Icon name="close" size={20} /></button>
          </header>
          <div className="chat__body" ref={bodyRef}>
            <p className="bubble bubble--bot">{t('chat.hello')}</p>
            {log.map((n, k) => (
              <div key={k}>
                <p className="bubble bubble--me">{CHAT[n].q[i]}</p>
                <p className="bubble bubble--bot">{CHAT[n].a[i]}</p>
              </div>
            ))}
            <div className="chat__qs">
              {log.length > 0 && <span className="hint">{t('chat.more')}</span>}
              {CHAT.map((c, n) => (!log.includes(n) ? <button key={n} type="button" onClick={() => setLog([...log, n])}>{c.q[i]}</button> : null))}
            </div>
          </div>
          <footer className="chat__foot">
            <a href={waLink('Hello POOMPAVAI')} target="_blank" rel="noopener noreferrer" className="btn btn--gold btn--sm btn--block"><Icon name="whatsapp" size={18} /> {t('chat.whatsapp')}</a>
          </footer>
        </section>
      )}
    </>
  );
}
