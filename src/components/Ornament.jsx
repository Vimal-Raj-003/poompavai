// Small inline SVG motifs: gopuram tiers, lotus, and the brand mark.
export function Gopuram({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
      <path d="M32 4l3 5h-1.6l3.6 5h-2.6l4 6h-3l4.4 7H21.2l4.4-7h-3l4-6H24l3.6-5H26z" />
      <rect x="15" y="29" width="34" height="4" rx="1" />
      <rect x="11" y="35" width="42" height="5" rx="1" />
      <rect x="7" y="42" width="50" height="6" rx="1" />
      <rect x="3" y="50" width="58" height="6" rx="1" />
    </svg>
  );
}

export function Lotus({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
      <path d="M32 8c5 7 7 14 0 24-7-10-5-17 0-24z" />
      <path d="M32 34c-9-1-16-6-20-14 9-1 17 2 20 14z" opacity=".85" />
      <path d="M32 34c9-1 16-6 20-14-9-1-17 2-20 14z" opacity=".85" />
      <path d="M32 38c-8 3-17 2-26-3 7-6 17-6 26 3z" opacity=".7" />
      <path d="M32 38c8 3 17 2 26-3-7-6-17-6-26 3z" opacity=".7" />
      <path d="M22 46c6 6 14 6 20 0-6 2-14 2-20 0z" opacity=".6" />
    </svg>
  );
}

export function Divider({ icon = 'lotus' }) {
  return <div className="divider" aria-hidden="true">{icon === 'gopuram' ? <Gopuram /> : <Lotus />}</div>;
}

export function Icon({ name, size = 22 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  switch (name) {
    case 'cart': return <svg {...p}><path d="M3 4h2.2l2.2 11h10.4l2-8H6.4" /><circle cx="9.5" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></svg>;
    case 'user': return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.2-6.5 8-6.5s7 2 8 6.5" /></svg>;
    case 'menu': return <svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case 'close': return <svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case 'share': return <svg {...p}><circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" /><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3" /></svg>;
    case 'chat': return <svg {...p}><path d="M4 5h16v11H9l-5 4z" /></svg>;
    case 'check': return <svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    case 'pin': return <svg {...p}><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
    case 'phone': return <svg {...p}><path d="M5 4h4l1.6 4-2.2 1.4a11 11 0 005.2 5.2L15.000 12.400 19 14v4a2 2 0 01-2 2A13 13 0 013 6a2 2 0 012-2z" /></svg>;
    case 'mail': return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'hand': return <svg {...p}><path d="M8 12V5.5a1.5 1.5 0 013 0V11M11 10V4.5a1.5 1.5 0 013 0V11M14 10V6a1.5 1.5 0 013 0v7c0 4-2.500 7-6 7-3 0-4.500-1.500-6-4l-1.500-2.500a1.500 1.500 0 012.500-1.500L8 14" /></svg>;
    case 'nod': return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M7 21l1.500-6h7L17 21M4 6c1-1.500 2-2.200 3-2.500M20 6c-1-1.500-2-2.200-3-2.500" /></svg>;
    case 'seal': return <svg {...p}><path d="M12 3l2.400 2 3.100-.3.9 3 2.600 1.700-1 3 1 3-2.600 1.700-.9 3-3.100-.3L12 21l-2.400-2-3.100.3-.9-3L3 14.600l1-3-1-3 2.600-1.700.9-3 3.100.3z" /><path d="M8.500 12l2.500 2.500 4.500-5" /></svg>;
    case 'gift': return <svg {...p}><rect x="3.500" y="9" width="17" height="11" rx="1.500" /><path d="M3 9h18v-3H3zM12 6v14M12 6c-2-3-5-3-5-1s3 1 5 1zm0 0c2-3 5-3 5-1s-3 1-5 1z" /></svg>;
    case 'box': return <svg {...p}><path d="M3 7.500L12 3l9 4.500v9L12 21l-9-4.500z" /><path d="M3 7.500l9 4.500 9-4.500M12 12v9" /></svg>;
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>;
    case 'truck': return <svg {...p}><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7z" /><circle cx="6.500" cy="17.500" r="1.800" /><circle cx="16.500" cy="17.500" r="1.800" /></svg>;
    case 'whatsapp': return <svg {...p}><path d="M4 20l1.200-4.200A8 8 0 1112 20a8 8 0 01-3.800-1z" /><path d="M9 8.500c0 3.500 3 6.500 6.500 6.500l1-1.500-2-1-1 .8a4 4 0 01-2-2l.8-1-1-2z" /></svg>;
    case 'instagram': return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="4.500" /><circle cx="12" cy="12" r="3.600" /><circle cx="17" cy="7" r=".6" fill="currentColor" /></svg>;
    case 'facebook': return <svg {...p}><path d="M14 8h2.500V4.500H14a3.500 3.500 0 00-3.500 3.500v2H8V13.500h2.500V20H14v-6.500h2.500L17 10h-3V8.500c0-.3.200-.500.500-.500z" /></svg>;
    default: return null;
  }
}

export function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      <Gopuram className="logo__mark" />
      <span className="logo__text">
        <span className="logo__name">POOMPAVAI</span>
        <span className="logo__ta" lang="ta">பூம்பாவை</span>
      </span>
    </span>
  );
}
