import StatsBar from './StatsBar';
import StopList from './StopList';

function buildMapsUrl(stops, depot) {
  const geocoded = stops.filter(s => s.customers?.lat || s.lat);
  if (!geocoded.length) return null;

  const origin = `${depot.lat},${depot.lng}`;
  const destination = origin;
  const waypoints = geocoded
    .map(s => `${s.customers?.lat || s.lat},${s.customers?.lng || s.lng}`)
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
}

const DEPOT = { lat: 51.750589, lng: 0.157336 };

export default function RouteCard({ stops, runDate, runStatus, onDispatch, onDeleteStop, onUpdateStop }) {
  const mapsUrl = buildMapsUrl(stops, DEPOT);

  const dateLabel = runDate
    ? new Date(runDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const statusColors = {
    building:   'var(--amber)',
    optimising: 'var(--amber)',
    ready:      'var(--green)',
    dispatched: 'var(--light-mid)',
  };

  return (
    <div style={{ background: 'var(--charcoal)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '2px', color: 'var(--cream)' }}>
            Delivery Run — {dateLabel}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', color: statusColors[runStatus] || 'var(--light-mid)', marginTop: '2px', letterSpacing: '1px' }}>
            ● {(runStatus || 'building').toUpperCase()}
          </div>
        </div>

        <div className="flex gap-2">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.5rem 1rem', background: 'var(--rust)', borderRadius: '6px',
                color: 'var(--cream)', fontFamily: 'IBM Plex Mono', fontSize: '0.75rem',
                letterSpacing: '1px', textDecoration: 'none', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = 'var(--blood)'}
              onMouseLeave={e => e.target.style.background = 'var(--rust)'}
            >
              OPEN IN MAPS ↗
            </a>
          )}
          {onDispatch && stops.length > 0 && runStatus !== 'dispatched' && (
            <button
              onClick={onDispatch}
              style={{
                padding: '0.5rem 1rem', background: 'var(--green-dark)', border: 'none', borderRadius: '6px',
                color: 'white', fontFamily: 'IBM Plex Mono', fontSize: '0.75rem',
                letterSpacing: '1px', cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = 'var(--green)'}
              onMouseLeave={e => e.target.style.background = 'var(--green-dark)'}
            >
              DISPATCH DRIVER ✓
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsBar stops={stops} />

      {/* Stop list */}
      <div style={{ padding: '0 1.5rem 1.5rem', maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.62rem', letterSpacing: '3px', color: 'var(--light-mid)', marginBottom: '0.75rem' }}>
          ROUTE STOPS
        </div>
        <StopList stops={stops} onDelete={onDeleteStop} onUpdate={onUpdateStop} />
      </div>
    </div>
  );
}
