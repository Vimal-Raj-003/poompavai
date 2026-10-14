// Derives web-ready copies of the source art into public/. Source folders are never modified.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = (...p) => path.join(root, 'public', ...p);
for (const d of ['hero', 'products']) fs.mkdirSync(out(d), { recursive: true });

// Hero frames: 1920x1080 video frames with black pillarbox; real picture is x 600..1320.
const frameDir = path.join(root, 'hero-frame', fs.readdirSync(path.join(root, 'hero-frame')).find((n) => n.endsWith('-jpg')));
const frames = fs.readdirSync(frameDir).filter((f) => /^ezgif-frame-\d+\.jpg$/.test(f)).sort();
for (const [i, f] of frames.entries()) {
  await sharp(path.join(frameDir, f))
    .extract({ left: 600, top: 0, width: 720, height: 1080 })
    .resize(480, 720)
    .webp({ quality: 82 })
    .toFile(out('hero', `f${String(i + 1).padStart(3, '0')}.webp`));
}
fs.writeFileSync(out('hero', 'manifest.json'), JSON.stringify({ count: frames.length, width: 480, height: 720, pattern: 'f{n}.webp', pad: 3, fps: 12 }));

// Temple (kept at native resolution; never upscaled).
await sharp(path.join(root, 'temple-img', 'temple-img.jpg')).webp({ quality: 86 }).toFile(out('temple.webp'));

// Products: webp for the page (full + card size), untouched jpg copy for Open Graph.
for (const f of fs.readdirSync(path.join(root, 'doll-img')).filter((n) => /\.jpe?g$/i.test(n))) {
  const base = path.parse(f).name.replace(/\.jpe?g$/i, ''); // tolerates names like img1-clean.jpg.jpg
  const src = path.join(root, 'doll-img', f);
  await sharp(src).webp({ quality: 84 }).toFile(out('products', `${base}.webp`));
  await sharp(src).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out('products', `${base}-sm.webp`));
  fs.copyFileSync(src, out('products', `${base}.jpg`));
}
console.log(`frames: ${frames.length}`);

// Open Graph image for the home page: temple on the right, brand on the left (1200x630).
const temple = await sharp(path.join(root, 'temple-img', 'temple-img.jpg')).resize(630, 630, { fit: 'cover', position: 'north' }).toBuffer();
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="570" height="630"><rect width="570" height="630" fill="#35090a"/><text x="48" y="300" font-family="Georgia,serif" font-size="64" font-weight="700" letter-spacing="8" fill="#dcc07f">POOMPAVAI</text><text x="48" y="360" font-family="Georgia,serif" font-size="30" fill="#f8f1e3">Thanjavur Thalaiyatti Bommai</text><text x="48" y="410" font-family="Georgia,serif" font-size="22" fill="#cdb892">Thanjavur's heritage, for your home.</text></svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#35090a' } }).composite([{ input: svg, left: 0, top: 0 }, { input: temple, left: 570, top: 0 }]).jpeg({ quality: 86 }).toFile(out('temple-og.jpg'));
