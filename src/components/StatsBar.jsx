function StatCard({ label, value, sub, accent }) {
  const colors = {
    green: 'var(--green)',
    amber: 'var(--amber)',
    rust:  'var(--rust)',
    bone:  'var(--bone)',
  };
  const color = colors[accent] || 'var(--bone)';

  return (
    <div style={{ background: 'var(--charcoal)', borderTop: `3px solid ${color}` }}
      className="rounded p-4 flex-1 min-w-0">
      <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--light-mid)' }}
        className="uppercase mb-1">{label}</div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.2rem', color: 'var(--cream)', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--light-mid)', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

export default function StatsBar({ stops }) {
  const total    = stops.length;
  const early    = stops.filter(s => s.early).length;
  const tbc      = stops.filter(s => s.tbc).length;
  const cases    = stops.reduce((acc, s) => acc + (s.unit === 'cases'  ? (s.quantity || 0) : 0), 0);
  const pallets  = stops.reduce((acc, s) => acc + (s.unit === 'pallets' ? (s.quantity || 0) : 0), 0);

  return (
    <div className="flex gap-3 p-4">
      <StatCard label="Stops"   value={total}   accent="bone" />
      <StatCard label="Cases"   value={cases || '—'}   sub={pallets ? `+ ${pallets} pallets` : null} accent="rust" />
      <StatCard label="Early"   value={early || '—'}  sub="priority drops" accent="amber" />
      <StatCard label="TBC"     value={tbc || '—'}    sub="unconfirmed"    accent="rust" />
    </div>
  );
}
