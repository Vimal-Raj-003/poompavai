import { useState } from 'react';

// Plain-SVG charts. One series per chart, one axis, labelled values (never colour-only).
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const SERIES = '#7a2424'; // maroon
const fmt = (n) => Number(n).toLocaleString('en-IN');

export function ColumnChart({ data, x, y, label, money = false, height = 190 }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = height, pad = { l: 44, r: 8, t: 12, b: 26 };
  const max = Math.max(1, ...data.map((d) => d[y]));
  const bw = (W - pad.l - pad.r) / data.length;
  const ticks = [0, max / 2, max];
  const total = data.reduce((s, d) => s + d[y], 0);
  return (
    <figure className="chart">
      <figcaption>{label} <span className="chart__sum">{money ? '₹' : ''}{fmt(total)} · last 30 days</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}, last 30 days`}>
        {ticks.map((t) => {
          const yy = pad.t + (H - pad.t - pad.b) * (1 - t / max);
          return <g key={t}><line x1={pad.l} x2={W - pad.r} y1={yy} y2={yy} stroke="var(--line)" strokeDasharray={t ? '3 4' : ''} /><text x={pad.l - 6} y={yy + 4} textAnchor="end" fontSize="11" fill={MUTED}>{fmt(Math.round(t))}</text></g>;
        })}
        {data.map((d, i) => {
          const h = (H - pad.t - pad.b) * (d[y] / max);
          return (
            <g key={d[x]} onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              <rect x={pad.l + i * bw + 2} y={H - pad.b - h} width={Math.max(1, bw - 4)} height={h} rx="3" fill={SERIES} opacity={hover && hover !== d ? 0.45 : 1} />
            </g>
          );
        })}
        {[0, 14, 29].map((i) => data[i] && <text key={i} x={pad.l + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill={MUTED}>{data[i][x].slice(5)}</text>)}
      </svg>
      <div className="chart__tip" aria-live="polite">{hover ? `${hover[x]}: ${money ? '₹' : ''}${fmt(hover[y])}` : ' '}</div>
    </figure>
  );
}

export function LineChart({ data, x, y, label, height = 190 }) {
  const W = 640, H = height, pad = { l: 44, r: 12, t: 12, b: 26 };
  const max = Math.max(1, ...data.map((d) => d[y]));
  const min = Math.min(...data.map((d) => d[y]));
  const lo = Math.max(0, min - (max - min) * 0.2);
  const px = (i) => pad.l + ((W - pad.l - pad.r) * i) / Math.max(1, data.length - 1);
  const py = (v) => pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / Math.max(1, max - lo));
  const d = data.map((r, i) => `${i ? 'L' : 'M'}${px(i)},${py(r[y])}`).join(' ');
  return (
    <figure className="chart">
      <figcaption>{label} <span className="chart__sum">{fmt(data.at(-1)?.[y] ?? 0)} now</span></figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {[lo, (lo + max) / 2, max].map((t) => <g key={t}><line x1={pad.l} x2={W - pad.r} y1={py(t)} y2={py(t)} stroke="var(--line)" strokeDasharray="3 4" /><text x={pad.l - 6} y={py(t) + 4} textAnchor="end" fontSize="11" fill={MUTED}>{fmt(Math.round(t))}</text></g>)}
        <path d={d} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" />
        {data.length > 0 && <circle cx={px(data.length - 1)} cy={py(data.at(-1)[y])} r="4.5" fill={SERIES} stroke="var(--ivory)" strokeWidth="2" />}
        {[0, data.length - 1].map((i) => data[i] && <text key={i} x={px(i)} y={H - 8} textAnchor={i ? 'end' : 'start'} fontSize="11" fill={MUTED}>{data[i][x].slice(5)}</text>)}
      </svg>
    </figure>
  );
}

// Horizontal bars with the value written at the end of each bar.
export function BarList({ rows, label, money = false, empty = 'No data yet' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure className="chart">
      <figcaption>{label}</figcaption>
      {rows.length === 0 ? <p className="hint">{empty}</p> : (
        <ul className="barlist">
          {rows.map((r) => (
            <li key={r.name}>
              <span className="barlist__name">{r.name}</span>
              <span className="barlist__track"><i style={{ width: `${(r.value / max) * 100}%`, background: r.color || SERIES }} /></span>
              <b>{money ? '₹' : ''}{fmt(r.value)}</b>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
