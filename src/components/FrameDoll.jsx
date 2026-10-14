import { useEffect, useRef, useState } from 'react';
import { frameUrl } from '../lib/frames.js';

const CONCURRENCY = 4;
const bitmapCache = new Map(); // manifest key -> decoded frames, shared between hero and product pages

const keyOf = (m) => `${m.base}|${m.pattern}|${m.count}`;

// Plays a frame sequence on a <canvas> (no video, no layout shift, no flicker).
//  - frame 1 is shown at once as a poster, the rest stream in order with limited concurrency
//  - playback starts as soon as a few frames are decoded and widens as more arrive
//  - loop "pingpong" (1..N..1) avoids a jump when the last frame does not match the first
export default function FrameDoll({ manifest, loop = 'pingpong', className = '', label, startAt = 4 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const fps = manifest.fps || 12;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const key = keyOf(manifest);
    const frames = bitmapCache.get(key) || [];
    bitmapCache.set(key, frames);
    let alive = true;
    let visible = true;
    let raf = 0;
    let t0 = 0;
    let lastDrawn = -1;
    let first = true;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const load = async (i) => {
      if (frames[i]) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = frameUrl(manifest, i);
      try { await img.decode(); } catch { return; }
      if (!alive) return;
      frames[i] = await createImageBitmap(img);
    };

    const draw = (i) => {
      const f = frames[i];
      if (!f || i === lastDrawn) return;
      ctx.drawImage(f, 0, 0, canvas.width, canvas.height);
      lastDrawn = i;
      if (first) { first = false; setReady(true); }
    };

    const loadedRun = () => { let n = 0; while (frames[n]) n++; return n; }; // contiguous frames from 0

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) { t0 = 0; return; }
      const n = loadedRun();
      if (n < 1) return;
      if (reduce || n < Math.min(startAt, manifest.count)) { draw(0); return; }
      if (!t0) t0 = now;
      const step = Math.floor(((now - t0) / 1000) * fps);
      let idx;
      if (loop === 'pingpong' && n > 1) {
        const span = n - 1;
        const p = step % (span * 2);
        idx = p <= span ? p : span * 2 - p;
      } else {
        idx = step % n;
      }
      draw(idx);
    };

    (async () => {
      await load(0);
      if (!alive) return;
      draw(0);
      raf = requestAnimationFrame(tick);
      // remaining frames, in order, a few at a time
      let next = 1;
      const worker = async () => { while (alive && next < manifest.count) await load(next++); };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    })();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
    io.observe(wrapRef.current);

    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); };
  }, [manifest, loop, fps, startAt]);

  return (
    <div ref={wrapRef} className={`framedoll ${ready ? 'is-ready' : ''} ${className}`} style={{ aspectRatio: `${manifest.width} / ${manifest.height}` }}>
      <img className="framedoll__poster" src={frameUrl(manifest, 0)} width={manifest.width} height={manifest.height} alt="" fetchPriority="high" decoding="async" />
      <canvas ref={canvasRef} width={manifest.width} height={manifest.height} role="img" aria-label={label} />
    </div>
  );
}
