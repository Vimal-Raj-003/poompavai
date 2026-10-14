// Updates <title>, description and Open Graph tags for the current page; returns a cleanup that restores them.
// (Crawlers that do not run JavaScript get the same tags from /api/page, see vercel.json.)
const set = (sel, attr, value) => {
  let el = document.head.querySelector(sel);
  if (!el) {
    el = document.createElement('meta');
    const m = sel.match(/\[(name|property)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  const prev = el.getAttribute(attr);
  el.setAttribute(attr, value);
  return () => el.setAttribute(attr, prev ?? '');
};

export function setPageMeta({ title, description, image }) {
  const undo = [];
  const prevTitle = document.title;
  document.title = title;
  undo.push(() => { document.title = prevTitle; });
  const abs = image ? new URL(image.replace(/\.webp$/, '.jpg'), window.location.origin).href : null;
  undo.push(set('meta[name="description"]', 'content', description));
  undo.push(set('meta[property="og:title"]', 'content', title));
  undo.push(set('meta[property="og:description"]', 'content', description));
  if (abs) undo.push(set('meta[property="og:image"]', 'content', abs));
  undo.push(set('meta[property="og:url"]', 'content', window.location.href));
  return () => undo.reverse().forEach((f) => f());
}
