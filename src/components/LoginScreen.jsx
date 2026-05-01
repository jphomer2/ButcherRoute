import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--blood)',
    }}>
      <div style={{
        background: 'var(--charcoal)', border: '1px solid var(--mid)',
        borderRadius: '12px', padding: '2.5rem', width: '100%', maxWidth: '380px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="8" fill="var(--rust)" />
            <path d="M6 20h3.5l1.5-7h9l1.5 7H24M10 15h10M8 20a2 2 0 1 0 4 0M18 20a2 2 0 1 0 4 0"
              stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.2rem', color: 'var(--cream)', lineHeight: 1 }}>
              Butcher<span style={{ color: 'var(--rust)' }}>Route</span>
            </div>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.5rem', color: 'var(--light-mid)', letterSpacing: '1.5px', marginTop: '3px' }}>
              SUFFOLK FARMS · DISPATCH
            </div>
          </div>
        </div>

        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '1.5px', color: 'var(--light-mid)', display: 'block', marginBottom: '0.4rem' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                width: '100%', background: 'var(--blood)', border: '1px solid var(--mid)',
                borderRadius: '8px', color: 'var(--cream)', fontFamily: 'DM Mono',
                fontSize: '0.82rem', padding: '0.65rem 0.75rem', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--rust)'}
              onBlur={e => e.target.style.borderColor = 'var(--mid)'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '1.5px', color: 'var(--light-mid)', display: 'block', marginBottom: '0.4rem' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%', background: 'var(--blood)', border: '1px solid var(--mid)',
                borderRadius: '8px', color: 'var(--cream)', fontFamily: 'DM Mono',
                fontSize: '0.82rem', padding: '0.65rem 0.75rem', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--rust)'}
              onBlur={e => e.target.style.borderColor = 'var(--mid)'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '6px', padding: '0.6rem 0.75rem',
              fontFamily: 'DM Mono', fontSize: '0.72rem', color: '#DC2626',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.7rem',
              background: loading ? '#94A3B8' : 'var(--rust)',
              border: 'none', borderRadius: '8px', color: 'white',
              fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.88rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px', transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
