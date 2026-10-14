import { db } from '../server/lib/db.js';

// Serves the SPA shell for /product/:slug with product-specific <title>, Open Graph tags and
// Product structured data, so WhatsApp / Facebook / Google (which do not run JavaScript) see them.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const slug = url.searchParams.get('slug') || '';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = process.env.SITE_URL || `${proto}://${req.headers.host}`;
  let html;
  try {
    html = await (await fetch(`${origin}/index.html`)).text();
  } catch {
    res.statusCode = 502;
    return res.end('Unavailable');
  }
  let status = 200;
  try {
    const p = await db.product.findFirst({ where: { slug, status: 'ACTIVE' }, include: { assets: true } });
    if (p) {
      const price = p.offerPrice != null && p.offerPrice < p.price ? p.offerPrice : p.price;
      const name = p.name.en;
      const title = `${name} — POOMPAVAI | Thanjavur Thalaiyatti Bommai`;
      const desc = `${p.shortDesc.en} ₹${price}. Authentic Thanjavur dancing doll (Tanjore doll), a traditional Tamil heritage gift from POOMPAVAI.`;
      const img = p.assets.filter((a) => a.kind === 'IMAGE').sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;
      const imgAbs = img ? new URL(img.replace(/\.webp$/, '.jpg'), origin).href : `${origin}/temple-og.jpg`;
      const pageUrl = `${origin}/product/${p.slug}`;
      const ld = {
        '@context': 'https://schema.org', '@type': 'Product', name, description: p.shortDesc.en, image: imgAbs, brand: { '@type': 'Brand', name: 'POOMPAVAI' },
        offers: { '@type': 'Offer', url: pageUrl, priceCurrency: 'INR', price, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
      };
      html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`)
        .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`)
        .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`)
        .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(imgAbs)}" /><meta property="og:url" content="${esc(pageUrl)}" /><meta property="product:price:amount" content="${price}" /><meta property="product:price:currency" content="INR" />`)
        .replace('<!--pp:jsonld-->', `<link rel="canonical" href="${esc(pageUrl)}" /><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\u003c')}</script>`);
    } else status = 404;
  } catch (e) {
    console.error(e);
  }
  res.statusCode = status === 404 ? 200 : status; // the SPA shows its own "not found" view
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.end(html);
}
