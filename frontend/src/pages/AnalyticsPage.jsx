import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useIsMobile } from '../hooks/useIsMobile';

// Saving assumptions — UK meat delivery context
const FUEL_RATE       = 0.35;    // £/mile (diesel + vehicle wear)
const DRIVER_RATE     = 13 / 60; // £/minute
const ROUTE_SAVING    = 0.20;    // 20% shorter vs unoptimised manual routing
const DISPATCH_MINS   = 30;      // minutes saved per run vs manual planning

const STATUS_COLOR = {
  dispatched: 'var(--green)',
  ready:      'var(--amber)',
  building:   'var(--light-mid)',
};

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'DM Mono', fontSize: '0.58rem', letterSpacing: '2.5px',
      color: 'var(--light-mid)', marginBottom: '1rem', display: 'flex',
      alignItems: 'center', gap: '0.6rem',
    }}>
      <span style={{ display: 'inline-block', width: '18px', height: '1px', background: 'var(--mid)' }} />
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent, icon }) {
  const color = accent || 'var(--rust)';
  return (
    <div style={{
      background: 'var(--charcoal)', border: '1px solid var(--mid)',
      borderRadius: '12px', padding: '1.2rem 1.4rem',
      borderTop: `3px solid ${color}`,
      position: 'relative', overflow: 'hidden',
    }}>
      {icon && (
        <div style={{
          position: 'absolute', top: '1rem', right: '1rem',
          fontSize: '1rem', opacity: 0.25,
        }}>{icon}</div>
      )}
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.55rem', letterSpacing: '2px', color: 'var(--light-mid)', marginBottom: '0.55rem' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '2rem', color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.5px' }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', color: 'var(--light-mid)', marginTop: '6px', lineHeight: 1.5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SavingCard({ label, primary, primaryColor, sub1, sub2, empty }) {
  return (
    <div style={{
      background: 'var(--charcoal)', border: `1px solid ${empty ? 'var(--mid)' : primaryColor + '40'}`,
      borderRadius: '12px', padding: '1.3rem 1.5rem',
      borderLeft: `4px solid ${empty ? 'var(--mid)' : primaryColor}`,
    }}>
      <div style={{ fontFamily: 'DM Mono', fontSize: '0.55rem', letterSpacing: '2px', color: 'var(--light-mid)', marginBottom: '0.6rem' }}>
        {label}
      </div>
      {empty ? (
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: 'var(--light-mid)', marginTop: '0.3rem' }}>
          No data yet
        </div>
      ) : (
        <>
          <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: '1.9rem', color: primaryColor, lineHeight: 1 }}>
            {primary}
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.59rem', color: 'var(--light-mid)', marginTop: '8px', lineHeight: 1.7 }}>
            {sub1 && <div>{sub1}</div>}
            {sub2 && <div>{sub2}</div>}
          </div>
        </>
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

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [runs,    setRuns]    = useState([]);
  const [stops,   setStops]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState(30);

  useEffect(() => {
    loadData();
  }, [period]);

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

  // Overview stats
  const completedRuns  = runs.filter(r => r.status === 'dispatched').length;
  const totalStops     = stops.length;
  const earlyStops     = stops.filter(s => s.early).length;
  const unmatchedStops = stops.filter(s => !s.matched).length;
  const avgStops       = runs.length ? Math.round(totalStops / runs.length) : 0;

  // Savings — based on optimised (dispatched) runs that have miles data
  const optimisedRuns   = runs.filter(r => r.status === 'dispatched' && r.total_miles > 0);
  const optimisedMiles  = optimisedRuns.reduce((s, r) => s + (r.total_miles || 0), 0);
  const optimisedMins   = optimisedRuns.reduce((s, r) => s + (r.est_drive_minutes || 0), 0);
  const hasSavingsData  = optimisedRuns.length > 0;

  // What the unoptimised equivalent would have been
  const unoptimisedMiles   = hasSavingsData ? Math.round(optimisedMiles / (1 - ROUTE_SAVING)) : 0;
  const unoptimisedMins    = hasSavingsData ? Math.round(optimisedMins  / (1 - ROUTE_SAVING)) : 0;

  const milesSaved         = unoptimisedMiles - Math.round(optimisedMiles);
  const minsSaved          = unoptimisedMins  - Math.round(optimisedMins);
  const hrsSaved           = (minsSaved / 60).toFixed(1);
  const fuelSaved          = Math.round(milesSaved * FUEL_RATE);
  const driverCostSaved    = Math.round(minsSaved * DRIVER_RATE);
  const dispatchMinsSaved  = optimisedRuns.length * DISPATCH_MINS;
  const dispatchHrsSaved   = (dispatchMinsSaved / 60).toFixed(1);
  const dispatchCostSaved  = Math.round(dispatchMinsSaved * DRIVER_RATE);
  const totalSaved         = fuelSaved + driverCostSaved + dispatchCostSaved;

  // Chart data
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
          <button onClick={() => supabase.auth.signOut()} style={{
            background: 'transparent', border: '1px solid var(--mid)', borderRadius: '6px',
            color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.62rem',
            letterSpacing: '1px', padding: '5px 12px', cursor: 'pointer',
          }}>
            SIGN OUT
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: isMobile ? '1.25rem' : '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

        {/* Title + period selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: isMobile ? '1.4rem' : '1.6rem', color: 'var(--cream)', margin: 0, letterSpacing: '-0.5px' }}>
              Depot Analytics
            </h1>
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.58rem', color: 'var(--light-mid)', letterSpacing: '2px', marginTop: '4px' }}>
              PERFORMANCE · SAVINGS · ACTIVITY
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--charcoal)', padding: '4px', borderRadius: '8px', border: '1px solid var(--mid)' }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setPeriod(d)} style={{
                padding: '5px 14px', borderRadius: '5px', cursor: 'pointer',
                fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '1px',
                background: period === d ? 'var(--rust)' : 'transparent',
                border: 'none',
                color: period === d ? 'white' : 'var(--light-mid)',
                transition: 'all 0.15s',
              }}>
                {d}D
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.72rem', color: 'var(--light-mid)', textAlign: 'center', marginTop: '5rem' }}>
            Loading…
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ─────────────────────────────────── */}
            <SectionLabel>OVERVIEW — LAST {period} DAYS</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
              <StatCard label="TOTAL RUNS"        value={runs.length}      sub={`${completedRuns} dispatched`}                                    accent="var(--rust)"      icon="🚚" />
              <StatCard label="STOPS DELIVERED"   value={totalStops}       sub={`avg ${avgStops} per run`}                                         accent="var(--green)"     icon="📦" />
              <StatCard label="EARLY COLLECTIONS" value={earlyStops}       sub={`${totalStops ? Math.round(earlyStops/totalStops*100) : 0}% of stops`} accent="var(--amber)"  icon="⏰" />
              <StatCard label="UNMATCHED STOPS"   value={unmatchedStops}   sub="not in customer database"                                          accent="var(--light-mid)" icon="⚠️" />
            </div>

            {/* ── SAVINGS ──────────────────────────────────── */}
            <SectionLabel>ESTIMATED SAVINGS VS UNOPTIMISED ROUTING</SectionLabel>

            {/* Total saved hero banner */}
            <div style={{
              background: hasSavingsData
                ? 'linear-gradient(135deg, rgba(5,150,105,0.12) 0%, rgba(5,150,105,0.05) 100%)'
                : 'var(--charcoal)',
              border: `1px solid ${hasSavingsData ? 'rgba(5,150,105,0.3)' : 'var(--mid)'}`,
              borderRadius: '14px', padding: '1.75rem 2rem',
              marginBottom: '1rem',
              display: 'flex', alignItems: hasSavingsData ? 'flex-start' : 'center',
              justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
            }}>
              {hasSavingsData ? (
                <>
                  <div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: '0.55rem', letterSpacing: '2.5px', color: 'var(--green)', marginBottom: '6px' }}>
                      TOTAL ESTIMATED SAVING
                    </div>
                    <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: isMobile ? '2.8rem' : '3.4rem', color: 'var(--green)', lineHeight: 1, letterSpacing: '-1px' }}>
                      £{totalSaved.toLocaleString()}
                    </div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: '0.58rem', color: 'rgba(5,150,105,0.7)', marginTop: '8px' }}>
                      across {optimisedRuns.length} optimised {optimisedRuns.length === 1 ? 'run' : 'runs'}
                    </div>
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
                    gap: '0.75rem', flex: '1', maxWidth: isMobile ? '100%' : '460px',
                  }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                      <div style={{ fontFamily: 'DM Mono', fontSize: '0.52rem', letterSpacing: '1.5px', color: 'var(--light-mid)', marginBottom: '4px' }}>MILES SAVED</div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.2rem', color: 'var(--cream)' }}>{milesSaved.toLocaleString()}</div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: '0.55rem', color: 'var(--light-mid)', marginTop: '2px' }}>
                        {Math.round(optimisedMiles)}mi driven<br />vs {unoptimisedMiles}mi unopt.
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                      <div style={{ fontFamily: 'DM Mono', fontSize: '0.52rem', letterSpacing: '1.5px', color: 'var(--light-mid)', marginBottom: '4px' }}>DRIVE TIME SAVED</div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.2rem', color: 'var(--cream)' }}>{hrsSaved} hrs</div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: '0.55rem', color: 'var(--light-mid)', marginTop: '2px' }}>
                        {Math.round(optimisedMins)}m driven<br />vs {unoptimisedMins}m unopt.
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '0.85rem 1rem', gridColumn: isMobile ? 'span 2' : 'auto', textAlign: isMobile ? 'center' : 'left' }}>
                      <div style={{ fontFamily: 'DM Mono', fontSize: '0.52rem', letterSpacing: '1.5px', color: 'var(--light-mid)', marginBottom: '4px' }}>DISPATCH TIME SAVED</div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.2rem', color: 'var(--cream)' }}>{dispatchHrsSaved} hrs</div>
                      <div style={{ fontFamily: 'DM Mono', fontSize: '0.55rem', color: 'var(--light-mid)', marginTop: '2px' }}>
                        ~30 min per run<br />vs manual planning
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ width: '100%', textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: '1.1rem', color: 'var(--light-mid)', marginBottom: '6px' }}>
                    No optimised runs yet in this period
                  </div>
                  <div style={{ fontFamily: 'DM Mono', fontSize: '0.62rem', color: 'var(--light-mid)', opacity: 0.6, lineHeight: 1.7 }}>
                    Savings are calculated once a run is optimised and dispatched.<br />
                    Complete your first route optimisation to see fuel and time savings.
                  </div>
                </div>
              )}
            </div>

            {/* Savings breakdown cards */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginBottom: '0.75rem' }}>
              <SavingCard
                label="FUEL & VEHICLE COST SAVED"
                primary={hasSavingsData ? `£${fuelSaved.toLocaleString()}` : null}
                primaryColor="var(--green)"
                sub1={hasSavingsData ? `${milesSaved} miles not driven` : null}
                sub2={hasSavingsData ? `at £0.35/mile (diesel + wear)` : null}
                empty={!hasSavingsData}
              />
              <SavingCard
                label="DRIVER WAGE SAVED"
                primary={hasSavingsData ? `£${driverCostSaved.toLocaleString()}` : null}
                primaryColor="var(--amber)"
                sub1={hasSavingsData ? `${hrsSaved} hrs at £13/hr` : null}
                sub2={hasSavingsData ? `vs longest unoptimised route` : null}
                empty={!hasSavingsData}
              />
              <SavingCard
                label="DISPATCH TIME SAVED"
                primary={hasSavingsData ? `£${dispatchCostSaved.toLocaleString()}` : null}
                primaryColor="var(--rust)"
                sub1={hasSavingsData ? `${dispatchHrsSaved} hrs at £13/hr` : null}
                sub2={hasSavingsData ? `~30 min per run vs manual planning` : null}
                empty={!hasSavingsData}
              />
            </div>

            {/* Assumptions footnote */}
            <div style={{ fontFamily: 'DM Mono', fontSize: '0.54rem', color: 'var(--light-mid)', opacity: 0.5, marginBottom: '2.5rem', paddingLeft: '4px', lineHeight: 1.7 }}>
              Assumptions: 20% route efficiency gain vs unoptimised · £0.35/mi van running cost · £13/hr driver · 30 min dispatch time per run
            </div>

            {/* ── ACTIVITY ─────────────────────────────────── */}
            {runs.length > 0 && (
              <>
                <SectionLabel>STOPS PER RUN</SectionLabel>
                <div style={{
                  background: 'var(--charcoal)', border: '1px solid var(--mid)',
                  borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {runs.slice(0, 12).map(r => {
                      const count = stopsByDate[r.delivery_date] || 0;
                      const dateLabel = new Date(r.delivery_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                      const statusColor = STATUS_COLOR[r.status] || 'var(--rust)';
                      return (
                        <div key={r.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '78px 1fr 30px' : '108px 1fr 36px', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontFamily: 'DM Mono', fontSize: '0.63rem', color: 'var(--light-mid)' }}>{dateLabel}</span>
                          <MiniBar value={count} max={maxStops} color={statusColor} />
                          <span style={{ fontFamily: 'DM Mono', fontSize: '0.68rem', color: 'var(--cream)', textAlign: 'right' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <SectionLabel>RUN HISTORY</SectionLabel>
                <div style={{
                  background: 'var(--charcoal)', border: '1px solid var(--mid)',
                  borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem',
                }}>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--mid)', background: 'rgba(0,0,0,0.15)' }}>
                          {['Date', 'Stops', 'Miles driven', 'Drive time', 'Miles saved', 'Status'].map(h => (
                            <th key={h} style={{
                              padding: '0.7rem 1.25rem', textAlign: 'left',
                              fontFamily: 'DM Mono', fontSize: '0.55rem', letterSpacing: '1.5px',
                              color: 'var(--light-mid)', fontWeight: 400,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {runs.map((r, i) => {
                          const count    = stopsByDate[r.delivery_date] || 0;
                          const dateLabel = new Date(r.delivery_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                          const mins     = r.est_drive_minutes;
                          const timeLabel = mins ? `${Math.floor(mins/60)}h ${mins % 60}m` : '—';
                          const rowMilesSaved = (r.status === 'dispatched' && r.total_miles)
                            ? Math.round(r.total_miles * ROUTE_SAVING / (1 - ROUTE_SAVING))
                            : null;
                          const statusColor = STATUS_COLOR[r.status] || 'var(--light-mid)';
                          return (
                            <tr key={r.id} style={{
                              borderBottom: i < runs.length - 1 ? '1px solid var(--mid)' : 'none',
                              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                            }}>
                              <td style={{ padding: '0.7rem 1.25rem', fontFamily: 'DM Mono', fontSize: '0.7rem', color: 'var(--cream)' }}>{dateLabel}</td>
                              <td style={{ padding: '0.7rem 1.25rem', fontFamily: 'DM Mono', fontSize: '0.7rem', color: 'var(--cream)' }}>{count}</td>
                              <td style={{ padding: '0.7rem 1.25rem', fontFamily: 'DM Mono', fontSize: '0.7rem', color: 'var(--cream)' }}>{r.total_miles ? `${r.total_miles}mi` : '—'}</td>
                              <td style={{ padding: '0.7rem 1.25rem', fontFamily: 'DM Mono', fontSize: '0.7rem', color: 'var(--cream)' }}>{timeLabel}</td>
                              <td style={{ padding: '0.7rem 1.25rem', fontFamily: 'DM Mono', fontSize: '0.7rem', color: rowMilesSaved ? 'var(--green)' : 'var(--light-mid)' }}>
                                {rowMilesSaved ? `~${rowMilesSaved}mi` : '—'}
                              </td>
                              <td style={{ padding: '0.7rem 1.25rem' }}>
                                <span style={{
                                  fontFamily: 'DM Mono', fontSize: '0.58rem', letterSpacing: '1px',
                                  color: statusColor, background: `${statusColor}18`,
                                  border: `1px solid ${statusColor}40`,
                                  padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap',
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
                </div>
              </>
            )}

            {runs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', fontFamily: 'DM Mono', fontSize: '0.72rem', color: 'var(--light-mid)' }}>
                No runs in this period.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
