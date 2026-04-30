export default function DateBar({ date, onChange, onOptimise, onClear, optimising, runStatus, stopCount }) {
  const isToday = date === new Date().toISOString().split('T')[0];

  function shift(days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    onChange(d.toISOString().split('T')[0]);
  }

  return (
    <div style={{
      background: 'var(--charcoal)', borderBottom: '1px solid var(--mid)',
      padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
      <button onClick={() => shift(-1)} style={navBtn}>‹</button>

      <input
        type="date"
        value={date}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--blood)', border: '1px solid var(--mid)',
          borderRadius: '6px', color: 'var(--cream)', fontFamily: 'DM Mono',
          fontSize: '0.78rem', padding: '0.3rem 0.6rem', outline: 'none', cursor: 'pointer',
        }}
      />

      <button onClick={() => shift(1)} style={navBtn}>›</button>

      {isToday && (
        <span style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', color: 'var(--rust)', letterSpacing: '1px', fontWeight: 500 }}>
          TODAY
        </span>
      )}

      <div style={{ flex: 1 }} />

      {stopCount > 0 && runStatus !== 'dispatched' && (
        <button onClick={onClear} style={{
          padding: '0.38rem 0.9rem', borderRadius: '6px', border: '1px solid var(--mid)',
          cursor: 'pointer', background: 'transparent', color: 'var(--light-mid)',
          fontFamily: 'DM Mono', fontSize: '0.7rem', letterSpacing: '0.5px',
          transition: 'all 0.15s',
        }}>
          Clear
        </button>
      )}

      {stopCount > 0 && runStatus !== 'dispatched' && (
        <button onClick={onOptimise} disabled={optimising} style={{
          padding: '0.38rem 1rem', borderRadius: '6px', border: 'none',
          cursor: optimising ? 'not-allowed' : 'pointer',
          background: optimising ? '#94A3B8' : 'var(--rust)',
          color: 'white', fontFamily: 'DM Mono', fontSize: '0.7rem',
          letterSpacing: '0.5px', transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          {optimising ? 'Optimising…' : '⚡ Optimise Route'}
        </button>
      )}
    </div>
  );
}

const navBtn = {
  background: 'none', border: '1px solid var(--mid)', borderRadius: '6px',
  color: 'var(--bone)', cursor: 'pointer', padding: '0.2rem 0.65rem',
  fontFamily: 'DM Mono', fontSize: '0.9rem', transition: 'border-color 0.15s',
};
