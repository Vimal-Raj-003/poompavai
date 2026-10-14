// Business contact details. Replace the placeholders (or set the VITE_* variables in Vercel).
const env = import.meta.env;
export const SITE = {
  phone: env.VITE_CONTACT_PHONE || '+91 00000 00000',
  whatsapp: (env.VITE_WHATSAPP || '910000000000').replace(/\D/g, ''),
  email: env.VITE_CONTACT_EMAIL || 'hello@poompavai.example',
  instagram: env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/',
  facebook: env.VITE_FACEBOOK_URL || 'https://www.facebook.com/',
};
export const waLink = (text = '') => `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
