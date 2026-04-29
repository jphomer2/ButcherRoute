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
  building:   { label: 'BUILDING',   color: 'var(--amber)',    bg: 'rgba(42,143,168,0.12)' },
  optimising: { label: 'OPTIMISING', color: 'var(--amber)',    bg: 'rgba(42,143,168,0.12)' },
  ready:      { label: 'READY',      color: 'var(--green)',    bg: 'rgba(46,204,113,0.12)' },
  dispatched: { label: 'DISPATCHED', color: 'var(--light-mid)', bg: 'rgba(91,150,176,0.1)' },
};

export default function RouteCard({ stops, runDate, runStatus, runMiles, runMinutes, onDispatch, onDeleteStop, onUpdateStop }) {
  const mapsUrl = buildMapsUrl(stops, DEPOT);
  const status  = STATUS[runStatus] || STATUS.building;

  const dateLabel = runDate
    ? new Date(runDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div style={{ background: 'var(--charcoal)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>

      {/* Card header */}
      <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '2px', color: 'var(--cream)', lineHeight: 1 }}>
            Delivery Run
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: 'var(--light-mid)', marginTop: '3px' }}>
            {dateLabel}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontSize: '0.62rem', letterSpacing: '2px',
            color: status.color, background: status.bg, border: `1px solid ${status.color}40`,
            padding: '4px 12px', borderRadius: '20px',
          }}>
            ● {status.label}
          </div>

          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noreferrer" style={{
              padding: '0.45rem 1rem', background: 'var(--rust)', borderRadius: '6px',
              color: 'var(--cream)', fontFamily: 'IBM Plex Mono', fontSize: '0.72rem',
              letterSpacing: '1px', textDecoration: 'none', whiteSpace: 'nowrap',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              OPEN IN MAPS ↗
            </a>
          )}

          {onDispatch && stops.length > 0 && runStatus !== 'dispatched' && (
            <button onClick={onDispatch} style={{
              padding: '0.45rem 1.1rem', background: 'var(--green-dark)', border: 'none',
              borderRadius: '6px', color: 'white', fontFamily: 'IBM Plex Mono',
              fontSize: '0.72rem', letterSpacing: '1px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              DISPATCH
            </button>
          )}

          {runStatus === 'dispatched' && (
            <div style={{
              fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: 'var(--green)',
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
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.6rem', letterSpacing: '3px', color: 'var(--light-mid)', marginBottom: '0.75rem' }}>
          ROUTE STOPS
        </div>
        <StopList stops={stops} onDelete={onDeleteStop} onUpdate={onUpdateStop} />
      </div>
    </div>
  );
}
