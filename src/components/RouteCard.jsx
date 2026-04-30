import StatsBar from './StatsBar';
import StopList from './StopList';

function buildMapsUrl(stops, depot) {
  const geocoded = stops.filter(s => s.customers?.lat || s.lat);
  if (!geocoded.length) return null;
  const origin = `${depot.lat},${depot.lng}`;
  const waypoints = geocoded.map(s => `${s.customers?.lat || s.lat},${s.customers?.lng || s.lng}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${origin}&waypoints=${waypoints}&travelmode=driving`;
}

const DEPOT = { lat: 51.750589, lng: 0.157336 };

const STATUS = {
  building:   { label: 'BUILDING',   color: 'var(--amber)',    bg: 'rgba(217,119,6,0.08)' },
  optimising: { label: 'OPTIMISING', color: 'var(--amber)',    bg: 'rgba(217,119,6,0.08)' },
  ready:      { label: 'READY',      color: 'var(--green)',    bg: 'rgba(5,150,105,0.08)' },
  dispatched: { label: 'DISPATCHED', color: 'var(--light-mid)', bg: 'rgba(100,116,139,0.08)' },
};

export default function RouteCard({ stops, runDate, runStatus, runMiles, runMinutes, onDispatch, onUnlock, onDeleteStop, onUpdateStop }) {
  const mapsUrl = buildMapsUrl(stops, DEPOT);
  const status  = STATUS[runStatus] || STATUS.building;
  const locked  = runStatus === 'dispatched';

  const dateLabel = runDate
    ? new Date(runDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div style={{ background: 'var(--charcoal)', borderRadius: '10px', border: `1px solid ${locked ? 'rgba(100,116,139,0.3)' : 'var(--mid)'}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

      {/* Locked banner */}
      {locked && (
        <div style={{
          background: 'rgba(100,116,139,0.06)', borderBottom: '1px solid rgba(100,116,139,0.2)',
          padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.68rem', color: 'var(--light-mid)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            This run is committed — stops are read-only
          </div>
          <button
            onClick={onUnlock}
            style={{
              background: 'none', border: '1px solid var(--mid)', borderRadius: '5px',
              color: 'var(--light-mid)', fontFamily: 'DM Mono', fontSize: '0.65rem',
              padding: '2px 10px', cursor: 'pointer', letterSpacing: '0.5px',
            }}
          >
            Unlock
          </button>
        </div>
      )}

      {/* Card header */}
      <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--mid)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '1.5rem', letterSpacing: '2px', color: 'var(--cream)', lineHeight: 1 }}>
            Delivery Run
          </div>
          <div style={{ fontFamily: 'DM Mono', fontSize: '0.7rem', color: 'var(--light-mid)', marginTop: '3px' }}>
            {dateLabel}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            fontFamily: 'DM Mono', fontSize: '0.62rem', letterSpacing: '2px',
            color: status.color, background: status.bg, border: `1px solid ${status.color}40`,
            padding: '4px 12px', borderRadius: '20px',
          }}>
            ● {status.label}
          </div>

          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noreferrer" style={{
              padding: '0.45rem 1rem', background: 'var(--rust)', borderRadius: '6px',
              color: 'white', fontFamily: 'DM Mono', fontSize: '0.72rem',
              letterSpacing: '1px', textDecoration: 'none', whiteSpace: 'nowrap',
              border: 'none',
            }}>
              OPEN IN MAPS ↗
            </a>
          )}

          {onDispatch && stops.length > 0 && !locked && (
            <button onClick={onDispatch} style={{
              padding: '0.45rem 1.1rem', background: 'var(--green-dark)', border: 'none',
              borderRadius: '6px', color: 'white', fontFamily: 'DM Mono',
              fontSize: '0.72rem', letterSpacing: '1px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              DISPATCH
            </button>
          )}

          {locked && (
            <div style={{
              fontFamily: 'DM Mono', fontSize: '0.65rem', color: 'var(--green)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              SENT TO DRIVER
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsBar stops={stops} totalMiles={runMiles} estMinutes={runMinutes} />

      {/* Stop list */}
      <div style={{ padding: '1rem 1.5rem 1.5rem', maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'DM Mono', fontSize: '0.6rem', letterSpacing: '3px', color: 'var(--light-mid)', marginBottom: '0.75rem' }}>
          ROUTE STOPS
        </div>
        <StopList stops={stops} onDelete={onDeleteStop} onUpdate={onUpdateStop} locked={locked} />
      </div>
    </div>
  );
}
