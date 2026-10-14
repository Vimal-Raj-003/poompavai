import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { api } from '../lib/api.js';

let gisPromise;
function loadGis() {
  gisPromise ||= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return gisPromise;
}

// Google sign-in. The browser only gets an ID token; the server verifies it and decides
// who is an admin (verified email === SUPER_ADMIN_EMAIL). Nothing here grants any access.
export default function GoogleButton({ mode = 'customer', onDone, onError }) {
  const { config, lang } = useApp();
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);
  const clientId = config.googleClientId;
  const cb = useRef({});
  cb.current = { onDone, onError }; // latest handlers without re-rendering the Google button

  useEffect(() => {
    if (!clientId || !ref.current) return;
    let cancelled = false;
    loadGis().then(() => {
      if (cancelled) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try { cb.current.onDone(await api('/auth/google', { method: 'POST', body: { credential, mode } })); } catch (e) { cb.current.onError?.(e); }
        },
      });
      ref.current.innerHTML = '';
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: Math.min(340, ref.current.clientWidth || 340), locale: lang });
    }).catch(() => setFailed(true));
    return () => { cancelled = true; };
  }, [clientId, mode, lang]);

  if (!clientId || failed) return null;
  return <div className="googlebtn" ref={ref} />;
}
