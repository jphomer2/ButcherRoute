import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/AuthContext';
import LoginScreen from '../components/LoginScreen';
import { useIsMobile } from '../hooks/useIsMobile';

function StatCard({ label, value, sub, accent }) {
  const color = accent || 'var(--rust)';
  return (
    <div style={{
      background: 'var(--charcoal)',
      border: '1px solid var(--mid)',
      borderRadius: '12px',
      padding: '1.4rem 1.5rem',
      borderLeft: `4px solid ${color}`,
      boxShadow: `0 0 0 0 ${color}, inset 2px 0 12px ${color}18`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '1.1rem', right: '1.1rem',
        width: '8px', height: '8px', borderRadius: '50%',
        background: color, opacity: 0.5,
      }} />
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.57rem', letterSpacing: '2px', color: 'var(--light-mid)', marginBottom: '0.65rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '2.1rem', color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.5px' }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.61rem', color: 'var(--light-mid)', marginTop: '6px' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ height: '6px', background: 'var(--mid)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color || 'var(--rust)', borderRadius: '3px', transition: 'width 0.4s' }} />
    </div>
  );
}

const STATUS_COLOR = {
  dispatched: 'var(--green)',
  ready:      'var(--amber)',
  building:   'var(--light-mid)',
};

export default function AnalyticsPage() {
  const session  = useSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [runs,    setRuns]    = useState([]);
  const [stops,   setStops]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState(30);

  useEffect(() => {
    if (!session) return;
    loadData();
  }, [session, period]);

  async function loadData() {
    setLoading(true);
    const from = new Date();
    from.setDate(from.getDate() - period);
    const fromStr = from.toISOString().split('T')[0];

    const [runsRes, stopsRes] = await Promise.all([
      supabase.from('runs')
        .select('id, delivery_date, status, total_miles, est_drive_minutes')
        .gte('delivery_date', fromStr)
        .order('delivery_date', { ascending: false }),
      supabase.from('delivery_stops')
        .select('delivery_date, early, tbc, matched, quantity')
        .gte('delivery_date', fromStr),
    ]);

    setRuns(runsRes.data || []);
    setStops(stopsRes.data || []);
    setLoading(false);
  }

  if (session === undefined) return null;
  if (!session) return <LoginScreen />;

  // Derived stats
  const completedRuns  = runs.filter(r => r.status === 'dispatched').length;
  const totalMiles     = runs.reduce((s, r) => s + (r.total_miles || 0), 0);
  const totalStops     = stops.length;
  const earlyStops     = stops.filter(s => s.early).length;
  const unmatchedStops = stops.filter(s => !s.matched).length;
  const avgStops       = runs.length ? Math.round(totalStops / runs.length) : 0;
  const avgMiles       = runs.length ? Math.round(totalMiles / runs.length) : 0;

  // Stops per run for chart
  const stopsByDate = {};
  stops.forEach(s => { stopsByDate[s.delivery_date] = (stopsByDate[s.delivery_date] || 0) + 1; });
  const maxStops = Math.max(...Object.values(stopsByDate), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--blood)' }}>

      {/* Header */}
      <header style={{
        background: 'var(--charcoal)', borderBottom: '1px solid var(--mid)',
        padding: isMobile ? '0 1rem' : '0 1.5rem', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="var(--rust)" />
              <path d="M6 20h3.5l1.5-7h9l1.5 7H24M10 15h10M8 20a2 2 0 1 0 4 0M18 20a2 2 0 1 0 4 0"
                stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1rem', color: 'var(--cream)' }}>
              Butcher<span style={{ color: 'var(--rust)' }}>Route</span>
            </span>
          </div>

          {!isMobile && (
            <nav style={{ display: 'flex', gap: '0.25rem' }}>
              {[
                { label: 'DISPATCH', path: '/app' },
                { label: 'ANALYTICS', path: '/app/analytics' },
              ].map(({ label, path }) => (
                <button key={path} onClick={() => navigate(path)} style={{
                  background: path === '/app/analytics' ? 'rgba(194,81,42,0.1)' : 'transparent',
                  border: 'none', borderRadius: '6px',
                  color: path === '/app/analytics' ? 'var(--rust)' : 'var(--light-mid)',
                  fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '1.5px',
                  padding: '6px 12px', cursor: 'pointer',
                }}>
                  {label}
                </button>
              ))}
            </nav>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isMobile && (
            <button onClick={() => navigate('/app')} style={{
              background: 'transparent', border: '1px solid var(--mid)', borderRadius: '6px',
              color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.62rem',
              letterSpacing: '1px', padding: '5px 10px', cursor: 'pointer',
            }}>
              DISPATCH
            </button>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'transparent', border: '1px solid var(--mid)', borderRadius: '6px',
              color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.62rem',
              letterSpacing: '1px', padding: '5px 12px', cursor: 'pointer',
            }}
          >
            SIGN OUT
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: isMobile ? '1.25rem' : '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

        {/* Title + period selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.5rem', color: 'var(--cream)', margin: 0 }}>
              Depot Analytics
            </h1>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', color: 'var(--light-mid)', letterSpacing: '1px', marginTop: '3px' }}>
              SUFFOLK FARMS LTD
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setPeriod(d)} style={{
                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '1px',
                background: period === d ? 'var(--rust)' : 'transparent',
                border: `1px solid ${period === d ? 'var(--rust)' : 'var(--mid)'}`,
                color: period === d ? 'white' : 'var(--light-mid)',
              }}>
                {d}D
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.72rem', color: 'var(--light-mid)', textAlign: 'center', marginTop: '4rem' }}>
            Loading…
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <StatCard label="TOTAL RUNS"        value={runs.length}         sub={`${completedRuns} dispatched`} accent="var(--rust)" />
              <StatCard label="STOPS DELIVERED"   value={totalStops}          sub={`${avgStops} avg per run`}     accent="var(--green)" />
              <StatCard label="MILES DRIVEN"       value={totalMiles ? `${Math.round(totalMiles)}mi` : '—'} sub={`${avgMiles}mi avg per run`} accent="var(--amber)" />
              <StatCard label="EARLY COLLECTIONS" value={earlyStops}          sub={`${totalStops ? Math.round(earlyStops/totalStops*100) : 0}% of stops`} accent="var(--rust)" />
              <StatCard label="UNMATCHED STOPS"   value={unmatchedStops}      sub="customers not in database"    accent="var(--light-mid)" />
            </div>

            {/* Stops per run chart */}
            {runs.length > 0 && (
              <div style={{
                background: 'var(--charcoal)', border: '1px solid var(--mid)',
                borderRadius: '10px', padding: '1.5rem', marginBottom: '2rem',
              }}>
                <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--light-mid)', marginBottom: '1.25rem' }}>
                  STOPS PER RUN
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {runs.slice(0, 10).map(r => {
                    const count = stopsByDate[r.delivery_date] || 0;
                    const dateLabel = new Date(r.delivery_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                    return (
                      <div key={r.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '80px 1fr 32px' : '110px 1fr 40px', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontFamily: 'DM Mono', fontSize: '0.65rem', color: 'var(--light-mid)' }}>{dateLabel}</span>
                        <MiniBar value={count} max={maxStops} color={STATUS_COLOR[r.status] || 'var(--rust)'} />
                        <span style={{ fontFamily: 'DM Mono', fontSize: '0.68rem', color: 'var(--cream)', textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Run history table */}
            <div style={{
              background: 'var(--charcoal)', border: '1px solid var(--mid)',
              borderRadius: '10px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '1rem 1.5rem', borderBottom: '1px solid var(--mid)',
                fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--light-mid)',
              }}>
                RUN HISTORY
              </div>

              {runs.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', fontFamily: 'DM Mono', fontSize: '0.72rem', color: 'var(--light-mid)' }}>
                  No runs in this period.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--mid)' }}>
                      {['Date', 'Stops', 'Miles', 'Drive time', 'Status'].map(h => (
                        <th key={h} style={{
                          padding: '0.65rem 1.5rem', textAlign: 'left',
                          fontFamily: 'DM Mono', fontSize: '0.58rem', letterSpacing: '1.5px',
                          color: 'var(--light-mid)', fontWeight: 400,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r, i) => {
                      const count = stopsByDate[r.delivery_date] || 0;
                      const dateLabel = new Date(r.delivery_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                      const mins = r.est_drive_minutes;
                      const timeLabel = mins ? `${Math.floor(mins/60)}h ${mins%60}m` : '—';
                      const statusColor = STATUS_COLOR[r.status] || 'var(--light-mid)';
                      return (
                        <tr key={r.id} style={{
                          borderBottom: i < runs.length - 1 ? '1px solid var(--mid)' : 'none',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        }}>
                          <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'DM Mono', fontSize: '0.72rem', color: 'var(--cream)' }}>{dateLabel}</td>
                          <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'DM Mono', fontSize: '0.72rem', color: 'var(--cream)' }}>{count}</td>
                          <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'DM Mono', fontSize: '0.72rem', color: 'var(--cream)' }}>{r.total_miles ? `${r.total_miles}mi` : '—'}</td>
                          <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'DM Mono', fontSize: '0.72rem', color: 'var(--cream)' }}>{timeLabel}</td>
                          <td style={{ padding: '0.75rem 1.5rem' }}>
                            <span style={{
                              fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '1px',
                              color: statusColor, background: `${statusColor}18`,
                              border: `1px solid ${statusColor}40`,
                              padding: '3px 10px', borderRadius: '20px',
                            }}>
                              {r.status?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
