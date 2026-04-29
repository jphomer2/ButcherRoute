export default function Header() {
  return (
    <header style={{ background: 'var(--charcoal)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      className="px-6 flex items-center justify-between h-14 sticky top-0 z-50">

      <div className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="var(--rust)" />
          <path d="M5 19h3.5l1.5-7h9l1.5 7H23M9 14h10M7 19a2 2 0 1 0 4 0M17 19a2 2 0 1 0 4 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '3px', lineHeight: 1 }}>
            BUTCHER <span style={{ color: 'var(--amber)' }}>ROUTE</span>
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.55rem', color: 'var(--light-mid)', letterSpacing: '2px' }}>
            SUFFOLK FARMS · DISPATCH
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4" style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: 'var(--light-mid)' }}>
        <span>{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
          color: 'var(--green)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.62rem', letterSpacing: '1px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          LIVE
        </div>
      </div>
    </header>
  );
}
