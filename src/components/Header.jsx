export default function Header({ runDate }) {
  const today = runDate || new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <header style={{ background: 'var(--charcoal)', borderBottom: '3px solid var(--rust)' }}
      className="px-8 flex items-center justify-between h-16 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div style={{ background: 'var(--rust)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
          className="w-8 h-8 flex items-center justify-center text-sm">
          🥩
        </div>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '3px' }}>
          Suffolk <span style={{ color: 'var(--amber)' }}>Farms</span>
        </span>
      </div>

      <div className="flex items-center gap-6" style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.72rem', color: 'var(--light-mid)' }}>
        <span>{today}</span>
        <span style={{
          background: 'rgba(46,204,113,0.15)', border: '1px solid var(--green)',
          color: 'var(--green)', padding: '3px 10px', borderRadius: '20px',
          fontSize: '0.65rem', letterSpacing: '1px',
        }}>● LIVE</span>
      </div>
    </header>
  );
}
