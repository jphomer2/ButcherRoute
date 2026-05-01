import { supabase } from '../lib/supabase';

export default function Header({ onDriversOpen }) {
  return (
    <header style={{ background: 'var(--charcoal)', borderBottom: '1px solid var(--mid)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      className="px-6 flex items-center justify-between h-14 sticky top-0 z-50">

      <div className="flex items-center gap-3">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <rect width="30" height="30" rx="8" fill="var(--rust)" />
          <path d="M6 20h3.5l1.5-7h9l1.5 7H24M10 15h10M8 20a2 2 0 1 0 4 0M18 20a2 2 0 1 0 4 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '1px', color: 'var(--cream)', lineHeight: 1 }}>
            Butcher<span style={{ color: 'var(--rust)' }}>Route</span>
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.52rem', color: 'var(--light-mid)', letterSpacing: '1.5px', marginTop: '2px' }}>
            SUFFOLK FARMS · DISPATCH
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3" style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: 'var(--light-mid)' }}>
        <button
          onClick={onDriversOpen}
          style={{
            background: 'transparent', border: '1px solid var(--mid)', borderRadius: '6px',
            color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.65rem',
            letterSpacing: '1px', padding: '5px 12px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--rust)'; e.target.style.color = 'var(--cream)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--mid)'; e.target.style.color = 'var(--light-mid)'; }}
        >
          DRIVERS
        </button>

        <span className="mob-hide">{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>

        <div className="mob-hide" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)',
          color: 'var(--green)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.62rem', letterSpacing: '1px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          LIVE
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: 'transparent', border: '1px solid var(--mid)', borderRadius: '6px',
            color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.65rem',
            letterSpacing: '1px', padding: '5px 12px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = 'rgba(220,38,38,0.5)'; e.target.style.color = '#DC2626'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--mid)'; e.target.style.color = 'var(--light-mid)'; }}
        >
          SIGN OUT
        </button>
      </div>
    </header>
  );
}
