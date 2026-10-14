import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { api } from '../lib/api.js';
import GoogleButton from '../components/GoogleButton.jsx';
import { Divider } from '../components/Ornament.jsx';

const mobileOk = (v) => /^(\+?91|0)?[6-9]\d{9}$/.test(v.replace(/[\s\-()]/g, '')) || /^\+\d{8,15}$/.test(v.replace(/[\s\-()]/g, ''));
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function useFinish() {
  const { onAuthenticated, takeNext } = useApp();
  const nav = useNavigate();
  // After any successful sign-in: back to the pending purchase, otherwise straight to the products.
  return (res) => {
    onAuthenticated(res);
    const next = takeNext();
    nav(next || '/#collection', { replace: true });
  };
}

function Shell({ title, children, foot }) {
  const { t, peekNext } = useApp();
  return (
    <div className="authpage">
      <div className="authcard">
        <h1>{title}</h1>
        <Divider />
        {peekNext() && <p className="alert alert--info">{t('auth.pendingBuy')}</p>}
        {children}
        <p className="authcard__foot">{foot}</p>
      </div>
    </div>
  );
}

function Password({ id, label, value, onChange, error, autoComplete, hint }) {
  const { t } = useApp();
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pwwrap">
        <input id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={!!error} />
        <button type="button" onClick={() => setShow(!show)}>{show ? t('auth.hide') : t('auth.show')}</button>
      </div>
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

function EmailCode({ finish }) {
  const { t, lang, errText } = useApp();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e?.preventDefault();
    if (!emailOk(email)) return setErr(t('auth.emailInvalid'));
    setBusy(true); setErr('');
    try { await api('/auth/email/request', { method: 'POST', body: { email: email.trim(), language: lang } }); setSent(true); } catch (x) { setErr(errText(x)); }
    setBusy(false);
  };
  const verify = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { finish(await api('/auth/email/verify', { method: 'POST', body: { email: email.trim(), code: code.trim(), language: lang } })); } catch (x) { setErr(errText(x)); setBusy(false); }
  };

  return sent ? (
    <form onSubmit={verify} noValidate>
      <p className="alert alert--info">{t('auth.codeSent', { email: email.trim() })}</p>
      <div className="field">
        <label htmlFor="ecode">{t('auth.code')}</label>
        <input id="ecode" className="input input--code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus />
      </div>
      {err && <p className="alert alert--err" role="alert">{err}</p>}
      <button className="btn btn--maroon btn--block" disabled={busy || code.length !== 6}>{t('auth.verify')}</button>
      <div className="authcard__links">
        <button type="button" className="linkbtn" onClick={send} disabled={busy}>{t('auth.resend')}</button>
        <button type="button" className="linkbtn" onClick={() => { setSent(false); setCode(''); setErr(''); }}>{t('auth.changeEmail')}</button>
      </div>
    </form>
  ) : (
    <form onSubmit={send} noValidate>
      <div className="field">
        <label htmlFor="email">{t('auth.email')}</label>
        <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} />
        <span className="hint">{t('auth.noEmailPw')}</span>
      </div>
      {err && <p className="alert alert--err" role="alert">{err}</p>}
      <button className="btn btn--maroon btn--block" disabled={busy}>{t('auth.sendCode')}</button>
    </form>
  );
}

function LoginForm({ finish }) {
  const { t, errText } = useApp();
  const [mobile, setMobile] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!mobileOk(mobile)) return setErr(t('auth.mobileInvalid'));
    if (!pw) return setErr(t('auth.pwInvalid'));
    setBusy(true); setErr('');
    try { finish(await api('/auth/login', { method: 'POST', body: { mobile, password: pw } })); } catch (x) { setErr(errText(x)); setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="mobile">{t('auth.mobile')}</label>
        <input id="mobile" className="input" type="tel" inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
      </div>
      <Password id="pw" label={t('auth.password')} value={pw} onChange={setPw} autoComplete="current-password" />
      {err && <p className="alert alert--err" role="alert">{err}</p>}
      <button className="btn btn--maroon btn--block" disabled={busy}>{t('auth.loginBtn')}</button>
    </form>
  );
}

function CreateForm({ finish }) {
  const { t, lang, errText } = useApp();
  const [f, setF] = useState({ fullName: '', mobile: '', age: '', language: lang, password: '' });
  const [errs, setErrs] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.fullName.trim().length < 2) er.fullName = t('auth.nameInvalid');
    if (!mobileOk(f.mobile)) er.mobile = t('auth.mobileInvalid');
    const age = Number(f.age);
    if (!Number.isInteger(age) || age < 13 || age > 110) er.age = t('auth.ageInvalid');
    if (f.password.length < 8) er.password = t('auth.pwInvalid');
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true); setErr('');
    try { finish(await api('/auth/register', { method: 'POST', body: { ...f, age } })); } catch (x) { setErr(errText(x)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="fn">{t('auth.fullName')}</label>
        <input id="fn" className="input" autoComplete="name" value={f.fullName} onChange={(e) => set('fullName')(e.target.value)} aria-invalid={!!errs.fullName} />
        {errs.fullName && <span className="err">{errs.fullName}</span>}
      </div>
      <div className="field">
        <label htmlFor="mob">{t('auth.mobile')}</label>
        <input id="mob" className="input" type="tel" inputMode="tel" autoComplete="tel" value={f.mobile} onChange={(e) => set('mobile')(e.target.value)} aria-invalid={!!errs.mobile} />
        {errs.mobile && <span className="err">{errs.mobile}</span>}
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="age">{t('auth.age')}</label>
          <input id="age" className="input" type="number" inputMode="numeric" min="13" max="110" value={f.age} onChange={(e) => set('age')(e.target.value)} aria-invalid={!!errs.age} />
          {errs.age && <span className="err">{errs.age}</span>}
        </div>
        <div className="field">
          <label htmlFor="pl">{t('auth.prefLang')}</label>
          <select id="pl" className="input" value={f.language} onChange={(e) => set('language')(e.target.value)}>
            <option value="ta">தமிழ்</option>
            <option value="en">English</option>
            <option value="ml">മലയാളം</option>
          </select>
        </div>
      </div>
      <Password id="npw" label={t('auth.createPassword')} value={f.password} onChange={set('password')} autoComplete="new-password" error={errs.password} hint={t('auth.passwordHint')} />
      {err && <p className="alert alert--err" role="alert">{err}</p>}
      <button className="btn btn--maroon btn--block" disabled={busy}>{t('auth.signupBtn')}</button>
    </form>
  );
}

// One page, three clearly visible options: Create Account / Login / Sign In with Email Code.
function AuthPage({ initial }) {
  const { t, errText, auth } = useApp();
  const finish = useFinish();
  const nav = useNavigate();
  const [tab, setTab] = useState(initial);
  const [gerr, setGerr] = useState('');
  useEffect(() => { if (auth.customer) nav('/#collection', { replace: true }); }, []); // already signed in
  useEffect(() => setTab(initial), [initial]);

  const tabs = [['create', t('auth.tabCreate')], ['login', t('auth.tabLogin')], ['email', t('auth.tabEmail')]];
  const title = { create: t('auth.signupTitle'), login: t('auth.signinTitle'), email: t('auth.tabEmail') }[tab];
  return (
    <Shell title={title} foot={null}>
      <div className="tabs tabs--3" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => { setTab(id); setGerr(''); }}>{label}</button>
        ))}
      </div>
      {tab === 'create' && <CreateForm finish={finish} />}
      {tab === 'login' && <LoginForm finish={finish} />}
      {tab === 'email' && <EmailCode finish={finish} />}
      <div className="authcard__or"><span>{t('common.or')}</span></div>
      <GoogleButton mode="customer" onDone={finish} onError={(x) => setGerr(errText(x))} />
      {gerr && <p className="alert alert--err" role="alert">{gerr}</p>}
    </Shell>
  );
}

export const SignIn = () => <AuthPage initial="login" />;
export const SignUp = () => <AuthPage initial="create" />;
