import { HttpError } from './http.js';

export async function sendEmail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.VERCEL_ENV === 'production') throw new HttpError(503, 'Email is not configured', 'CONFIG');
    console.log(`[email:dev] to=${to} subject=${subject}\n${text}`);
    return;
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'POOMPAVAI <onboarding@resend.dev>', to, subject, text, html }),
  });
  if (!r.ok) throw new HttpError(502, 'Could not send the email. Please try again.', 'EMAIL_FAILED');
}

const COPY = {
  en: (c) => ({ s: 'Your POOMPAVAI verification code', b: `Your POOMPAVAI verification code is ${c}. It is valid for 10 minutes. If you did not ask for it, you can ignore this email.` }),
  ta: (c) => ({ s: 'உங்கள் POOMPAVAI சரிபார்ப்புக் குறியீடு', b: `உங்கள் POOMPAVAI சரிபார்ப்புக் குறியீடு ${c}. இது 10 நிமிடங்களுக்கு மட்டுமே செல்லுபடியாகும். நீங்கள் கேட்கவில்லை என்றால் இந்த மின்னஞ்சலைப் புறக்கணிக்கலாம்.` }),
  ml: (c) => ({ s: 'നിങ്ങളുടെ POOMPAVAI സ്ഥിരീകരണ കോഡ്', b: `നിങ്ങളുടെ POOMPAVAI സ്ഥിരീകരണ കോഡ് ${c}. ഇത് 10 മിനിറ്റ് നേരത്തേക്ക് മാത്രം സാധുവാണ്. നിങ്ങൾ ആവശ്യപ്പെട്ടതല്ലെങ്കിൽ ഈ ഇമെയിൽ അവഗണിക്കാം.` }),
};

export function codeEmail(code, lang) {
  const x = (COPY[lang] || COPY.en)(code);
  const body = x.b.replace(code, `<b style="font-size:22px;letter-spacing:4px">${code}</b>`);
  return {
    subject: x.s,
    text: x.b,
    html: `<div style="font-family:Georgia,serif;color:#3b2417"><h2 style="color:#6b1a1a">POOMPAVAI</h2><p>${body}</p></div>`,
  };
}
