import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import UI from '../i18n/ui.js';
import { api } from '../lib/api.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const LANG_IDX = { ta: 0, en: 1, ml: 2 };
const store = {
  get(k, fb = null) {
    try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch { return fb; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

function initialLang() {
  const q = new URLSearchParams(window.location.search).get('lang'); // ?lang=ta|en|ml for shared links
  if (LANG_IDX[q] !== undefined) return q;
  const saved = store.get('pp_lang');
  if (LANG_IDX[saved] !== undefined) return saved;
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('ml')) return 'ml';
  if (nav.startsWith('ta')) return 'ta';
  if (nav.startsWith('en') && !nav.endsWith('-in')) return 'en';
  return 'ta';
}

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);
  const [auth, setAuth] = useState({ ready: false, customer: null, isSuperAdmin: false });
  const [products, setProducts] = useState(null);
  const [cart, setCart] = useState(() => store.get('pp_cart', []));
  const [toast, setToast] = useState(null);
  const [config, setConfig] = useState({ razorpayKeyId: null, googleClientId: null, maxQty: 10, deliveryRange: null });
  const toastTimer = useRef();

  // ----- language -----
  const setLang = useCallback((l) => { setLangState(l); store.set('pp_lang', l); }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, vars) => {
    const row = UI[key];
    let s = row ? row[LANG_IDX[lang]] || row[1] : key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  }, [lang]);

  // ----- toast -----
  const notify = useCallback((msg, kind = 'ok') => {
    setToast({ msg, kind, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const errText = useCallback((e) => {
    if (!e) return t('common.error');
    if (e.code === 'OFFLINE') return t('common.offline');
    return e.message && e.status && e.status < 500 ? e.message : t('common.error');
  }, [t]);

  // ----- bootstrap: session, catalogue, config -----
  const refreshMe = useCallback(async () => {
    try {
      const me = await api('/auth/me');
      setAuth({ ready: true, customer: me.customer, isSuperAdmin: me.isSuperAdmin });
      return me;
    } catch {
      setAuth((a) => ({ ...a, ready: true }));
      return null;
    }
  }, []);

  useEffect(() => {
    refreshMe();
    api('/products').then((d) => setProducts(d.products)).catch(() => setProducts([]));
    api('/config').then(setConfig).catch(() => {});
  }, [refreshMe]);

  // ----- cart (local for guests, mirrored to the server for signed-in customers) -----
  const syncedFor = useRef(null);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => { store.set('pp_cart', cart); }, [cart]);

  // when a customer becomes known, merge the guest cart into the saved one
  useEffect(() => {
    const id = auth.customer?.id;
    if (!id || syncedFor.current === id) return;
    syncedFor.current = id;
    api('/cart/merge', { method: 'POST', body: { items: cartRef.current } })
      .then((d) => setCart(d.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))))
      .catch(() => { syncedFor.current = null; });
  }, [auth.customer?.id]);

  const pushTimer = useRef();
  const pushCart = useCallback((items) => {
    if (!syncedFor.current) return;
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => api('/cart', { method: 'PUT', body: { items } }).catch(() => {}), 500);
  }, []);

  const maxQty = config.maxQty || 10;
  const updateCart = useCallback((fn) => {
    setCart((prev) => { const next = fn(prev); pushCart(next); return next; });
  }, [pushCart]);

  const addToCart = useCallback((productId, qty = 1) => {
    updateCart((c) => {
      const f = c.find((i) => i.productId === productId);
      return f ? c.map((i) => (i === f ? { ...i, quantity: Math.min(maxQty, i.quantity + qty) } : i)) : [...c, { productId, quantity: Math.min(maxQty, qty) }];
    });
  }, [updateCart, maxQty]);
  const setQty = useCallback((productId, qty) => {
    updateCart((c) => (qty < 1 ? c.filter((i) => i.productId !== productId) : c.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(maxQty, qty) } : i))));
  }, [updateCart, maxQty]);
  const removeFromCart = useCallback((productId) => updateCart((c) => c.filter((i) => i.productId !== productId)), [updateCart]);
  const clearCart = useCallback(() => updateCart(() => []), [updateCart]);

  const cartLines = useMemo(() => {
    if (!products) return [];
    return cart
      .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId) }))
      .filter((l) => l.product)
      .map((l) => ({ ...l, unit: l.product.offerPrice ?? l.product.price }));
  }, [cart, products]);
  const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0);
  const cartSubtotal = cartLines.reduce((s, l) => s + l.unit * l.quantity, 0);

  // ----- pending purchase intent (survives sign-in) -----
  const setNext = useCallback((path) => store.set('pp_next', path), []);
  const takeNext = useCallback(() => { const n = store.get('pp_next'); store.del('pp_next'); return n; }, []);
  const peekNext = useCallback(() => store.get('pp_next'), []);
  const setBuyNow = useCallback((item) => store.set('pp_buynow', item), []);
  const getBuyNow = useCallback(() => store.get('pp_buynow'), []);
  const clearBuyNow = useCallback(() => store.del('pp_buynow'), []);

  // ----- auth actions -----
  const onAuthenticated = useCallback((res) => {
    setAuth({ ready: true, customer: res.customer, isSuperAdmin: res.isSuperAdmin });
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST', body: {} }); } catch { /* ignore */ }
    syncedFor.current = null;
    setCart([]);
    store.del('pp_next');
    store.del('pp_buynow');
    setAuth({ ready: true, customer: null, isSuperAdmin: false });
  }, []);

  const value = {
    lang, setLang, t, notify, errText, toast,
    auth, refreshMe, onAuthenticated, logout,
    config, products,
    cart, cartLines, cartCount, cartSubtotal, addToCart, setQty, removeFromCart, clearCart,
    setNext, takeNext, peekNext, setBuyNow, getBuyNow, clearBuyNow,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
