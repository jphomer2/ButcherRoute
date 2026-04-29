export default function DateBar({ date, onChange, onOptimise, onClear, optimising, runStatus, stopCount }) {
  const isToday = date === new Date().toISOString().split('T')[0];

  function shift(days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().split('T')[0]);
  }

  return (
    <div style={{
      background: 'var(--charcoal)', borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
    }}>
      <button onClick={() => shift(-1)} style={navBtn}>‹</button>

      <input
        type="date"
        value={date}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--dark)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '6px', color: 'var(--cream)', fontFamily: 'IBM Plex Mono',
          fontSize: '0.8rem', padding: '0.3rem 0.6rem', outline: 'none', cursor: 'pointer',
        }}
      />

      <button onClick={() => shift(1)} style={navBtn}>›</button>

      {isToday && (
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: 'var(--amber)', letterSpacing: '1px' }}>
          TODAY
        </span>
      )}

      <div style={{ flex: 1 }} />

      {stopCount > 0 && (
        <button
          onClick={onClear}
          style={{
            padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer', background: 'transparent', color: 'var(--light-mid)',
            fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', letterSpacing: '1px',
          }}
        >
          CLEAR
        </button>
      )}
      {stopCount > 0 && runStatus !== 'dispatched' && (
        <button
          onClick={onOptimise}
          disabled={optimising}
          style={{
            padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', cursor: optimising ? 'not-allowed' : 'pointer',
            background: optimising ? 'var(--mid)' : 'var(--rust)', color: 'var(--cream)',
            fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', letterSpacing: '1px', transition: 'background 0.2s',
          }}
        >
          {optimising ? 'OPTIMISING...' : '⚡ OPTIMISE ROUTE'}
        </button>
      )}
    </div>
  );
}

const navBtn = {
  background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
  color: 'var(--bone)', cursor: 'pointer', padding: '0.2rem 0.6rem',
  fontFamily: 'IBM Plex Mono', fontSize: '0.9rem',
};
