import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useApp } from './state/AppContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Chatbot from './components/Chatbot.jsx';
import Home from './pages/Home.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import Account from './pages/Account.jsx';
import { SignIn, SignUp } from './pages/Auth.jsx';
import { Contact, Faq, InfoPage, NotFound } from './pages/Content.jsx';

const Admin = lazy(() => import('./admin/Admin.jsx'));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // wait a tick so the target section exists after navigation
      const id = hash.slice(1);
      const tryScroll = (n = 0) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else if (n < 10) setTimeout(() => tryScroll(n + 1), 80);
      };
      tryScroll();
    } else window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function Toast() {
  const { toast } = useApp();
  return toast ? <div className={`toast ${toast.kind === 'err' ? 'toast--err' : ''}`} role="status" key={toast.id}>{toast.msg}</div> : null;
}

function Storefront() {
  const { t } = useApp();
  return (
    <>
      <a href="#main" className="skip">{t('common.skip')}</a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id/confirmation" element={<OrderConfirmation />} />
          <Route path="/account/*" element={<Account />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/info/:topic" element={<InfoPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  return (
    <>
      <ScrollManager />
      {isAdmin ? (
        <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}><Admin /></Suspense>
      ) : <Storefront />}
      <Toast />
    </>
  );
}
