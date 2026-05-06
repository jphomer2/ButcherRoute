function StatCard({ label, value, sub, accent, dim }) {
  const colors = { green: 'var(--green)', amber: 'var(--amber)', rust: 'var(--rust)', bone: 'var(--bone)' };
  const color = dim ? 'var(--mid)' : (colors[accent] || 'var(--bone)');

  return (
    <div style={{
      background: 'var(--charcoal)', borderRadius: '8px', padding: '0.9rem 1rem',
      flex: 1, minWidth: 0,
      border: '1px solid var(--mid)', borderTopWidth: '2px', borderTopColor: color,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.58rem', letterSpacing: '2px', color: 'var(--light-mid)', marginBottom: '0.3rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'DM Sans', fontSize: '2rem', color: dim ? 'var(--mid)' : 'var(--cream)', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'var(--light-mid)', marginTop: '3px', fontFamily: 'DM Mono' }}>{sub}</div>}
    </div>
  );
}

export default function StatsBar({ stops, totalMiles, estMinutes }) {
  const total   = stops.length;
  const early   = stops.filter(s => s.early).length;
  const tbc     = stops.filter(s => s.tbc).length;
  const cases   = stops.reduce((acc, s) => acc + (s.unit !== 'pallets' ? (s.quantity || 0) : 0), 0);
  const pallets = stops.reduce((acc, s) => acc + (s.unit === 'pallets' ? (s.quantity || 0) : 0), 0);

  const hours = estMinutes ? Math.floor(estMinutes / 60) : null;
  const mins  = estMinutes ? estMinutes % 60 : null;
  const timeLabel = hours ? `${hours}h ${mins}m` : estMinutes ? `${estMinutes}m` : null;

  return (
    <div className="stats-grid" style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--mid)' }}>
      <StatCard label="Stops"  value={total}            accent="bone" dim={!total} />
      <StatCard label="Cases"  value={cases || '—'}     sub={pallets ? `+${pallets} pallets` : null} accent="rust" dim={!cases} />
      <StatCard label="Early"  value={early || '—'}     sub="priority" accent="amber" dim={!early} />
      <StatCard label="TBC"    value={tbc || '—'}       sub="unconfirmed" accent="rust" dim={!tbc} />
      <StatCard label="Miles"  value={totalMiles || '—'} sub={timeLabel} accent="bone" dim={!totalMiles} />
    </div>
  );
}
