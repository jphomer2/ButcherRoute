function Tag({ children, color }) {
  const colors = {
    red:   { bg: 'rgba(139,26,26,0.3)',  border: 'rgba(192,57,43,0.4)',  text: '#e88' },
    amber: { bg: 'rgba(230,126,34,0.15)', border: 'rgba(230,126,34,0.4)', text: 'var(--amber)' },
    green: { bg: 'rgba(46,204,113,0.15)', border: 'rgba(46,204,113,0.4)', text: 'var(--green)' },
    bone:  { bg: 'rgba(200,224,234,0.1)', border: 'rgba(200,224,234,0.2)', text: 'var(--bone)' },
  };
  const c = colors[color] || colors.bone;
  return (
    <span style={{
      fontSize: '0.6rem', background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, padding: '1px 6px', borderRadius: '4px',
      fontFamily: 'IBM Plex Mono', letterSpacing: '0.5px',
    }}>
      {children}
    </span>
  );
}

function StopRow({ stop, index }) {
  return (
    <div style={{
      background: 'var(--dark)', borderRadius: '6px', padding: '0.75rem',
      marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.06)',
      display: 'grid', gridTemplateColumns: '2rem 1fr auto', gap: '0.75rem', alignItems: 'start',
    }}>
      <div style={{
        width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600,
        background: index === 0 ? 'var(--rust)' : 'rgba(255,255,255,0.08)',
        border: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
        color: index === 0 ? 'white' : 'var(--bone)', flexShrink: 0,
        fontFamily: 'IBM Plex Mono',
      }}>
        {index === 0 ? '⌂' : stop.route_sequence || index + 1}
      </div>

      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cream)' }}>
          {stop.customers?.name || stop.customer_name_raw}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--light-mid)', marginTop: '2px' }}>
          {stop.customers?.postcode || stop.delivery_postcode || '—'}
          {stop.notes && <span style={{ marginLeft: '0.5rem', color: 'var(--mid)' }}>{stop.notes}</span>}
        </div>
        <div className="flex gap-1 flex-wrap mt-1">
          {stop.early && <Tag color="amber">EARLY {stop.early_time?.slice(0,5)}</Tag>}
          {stop.tbc   && <Tag color="red">TBC</Tag>}
          {!stop.matched && <Tag color="bone">UNMATCHED</Tag>}
          {stop.quantity >= 150 && <Tag color="red">LARGE LOAD</Tag>}
        </div>
      </div>

      <div style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono' }}>
        {stop.quantity != null && (
          <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 500 }}>
            {stop.quantity}
          </div>
        )}
        <div style={{ fontSize: '0.65rem', color: 'var(--light-mid)' }}>
          {stop.unit || 'cases'}
        </div>
      </div>
    </div>
  );
}

export default function StopList({ stops }) {
  if (!stops.length) {
    return (
      <div style={{ color: 'var(--mid)', fontFamily: 'IBM Plex Mono', fontSize: '0.8rem', textAlign: 'center', padding: '3rem 0' }}>
        No stops yet. Paste WhatsApp orders to build today's run.
      </div>
    );
  }

  const early  = stops.filter(s => s.early);
  const normal = stops.filter(s => !s.early);

  return (
    <div>
      {early.length > 0 && (
        <>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.62rem', letterSpacing: '3px', color: 'var(--amber)', marginBottom: '0.5rem' }}>
            ▲ PRIORITY — EARLY DROPS
          </div>
          {early.map((s, i) => <StopRow key={s.id} stop={s} index={i} />)}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
        </>
      )}
      {normal.map((s, i) => <StopRow key={s.id} stop={s} index={early.length + i} />)}
    </div>
  );
}
