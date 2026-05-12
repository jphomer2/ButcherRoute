import { Router }    from 'express';
import { makeUserClient } from '../lib/supabase.js';
import { withRetry }      from '../lib/retry.js';
import { getBreaker }     from '../lib/circuit-breaker.js';
import { validateOptimiseBody } from '../lib/validate.js';
import { logger }               from '../lib/logger.js';

const router = Router();
router.use((req, _res, next) => { req.sb = makeUserClient(req.accessToken); next(); });

const mapsBreaker = getBreaker('google-maps-routes');

const DEPOT = {
  lat: parseFloat(process.env.DEPOT_LAT) || 51.750589,
  lng: parseFloat(process.env.DEPOT_LNG) || 0.157336,
};

router.post('/', async (req, res, next) => {
  try {
    const { delivery_date } = validateOptimiseBody(req.body);
    const { sb } = req;

    const { data: run } = await sb
      .from('runs').select('id').eq('delivery_date', delivery_date).eq('company_id', req.companyId).maybeSingle();
    if (!run) return res.status(404).json({ error: 'No run found for this date' });

    const { data: stops, error } = await sb
      .from('delivery_stops')
      .select('id, customer_name_raw, tbc, customers(name, lat, lng)')
      .eq('run_id', run.id)
      .eq('tbc', false);
    if (error) throw Object.assign(new Error(error.message), { status: 500 });

    const geocoded     = stops.filter(s => s.customers?.lat && s.customers?.lng);
    const ungeocodable = stops.filter(s => !s.customers?.lat || !s.customers?.lng);

    if (geocoded.length < 2) {
      return res.json({ message: 'Not enough geocoded stops to optimise', maps_url: buildBasicUrl(stops) });
    }

    const waypoints = geocoded.map(s => ({
      location: { latLng: { latitude: s.customers.lat, longitude: s.customers.lng } },
      via: false,
    }));

    const body = {
      origin:               { location: { latLng: { latitude: DEPOT.lat, longitude: DEPOT.lng } } },
      destination:          { location: { latLng: { latitude: DEPOT.lat, longitude: DEPOT.lng } } },
      intermediates:        waypoints,
      travelMode:           'DRIVE',
      optimizeWaypointOrder: true,
      routingPreference:    'TRAFFIC_AWARE',
    };

    let optimisedOrder = null;
    let totalMetres    = null;
    let totalSeconds   = null;

    try {
      const routeJson = await mapsBreaker.call(() =>
        withRetry(async () => {
          const controller = new AbortController();
          const timer      = setTimeout(() => controller.abort(), 10_000);
          try {
            const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
              method:  'POST',
              headers: {
                'Content-Type':     'application/json',
                'X-Goog-Api-Key':   process.env.GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.distanceMeters,routes.duration',
              },
              body:   JSON.stringify(body),
              signal: controller.signal,
            });
            if (!r.ok) {
              const err = new Error(`Routes API ${r.status}`);
              err.status = r.status;
              throw err;
            }
            return r.json();
          } finally {
            clearTimeout(timer);
          }
        }, { retries: 2, baseDelay: 500, label: 'google-maps' })
      );

      if (routeJson.routes?.[0]) {
        const route    = routeJson.routes[0];
        optimisedOrder = route.optimizedIntermediateWaypointIndex;
        totalMetres    = route.distanceMeters;
        totalSeconds   = parseInt(route.duration?.replace('s', '') || '0');
      }
    } catch (err) {
      // Degrade gracefully — return a basic map URL without optimised order
      logger.warn({ type: 'maps_api_failed', error: err.message });
    }

    if (optimisedOrder) {
      for (const [newSeq, origIdx] of optimisedOrder.entries()) {
        await req.sb.from('delivery_stops').update({ route_sequence: newSeq + 1 }).eq('id', geocoded[origIdx].id);
      }
      for (let i = 0; i < ungeocodable.length; i++) {
        await req.sb.from('delivery_stops')
          .update({ route_sequence: optimisedOrder.length + i + 1 })
          .eq('id', ungeocodable[i].id);
      }
    }

    const miles   = totalMetres  ? Math.round(totalMetres  / 1609.344 * 10) / 10 : null;
    const minutes = totalSeconds ? Math.round(totalSeconds / 60) : null;
    const mapsUrl = buildOptimisedUrl(geocoded, optimisedOrder);

    await req.sb.from('runs')
      .update({ status: 'ready', total_miles: miles, est_drive_minutes: minutes, route_url: mapsUrl, updated_at: new Date().toISOString() })
      .eq('id', run.id);

    logger.info({ type: 'optimise_complete', company_id: req.companyId, stops: geocoded.length, miles });

    res.json({
      stops_optimised:   geocoded.length,
      stops_skipped:     ungeocodable.length,
      total_miles:       miles,
      est_drive_minutes: minutes,
      maps_url:          mapsUrl,
      optimised_order:   optimisedOrder,
    });
  } catch (err) {
    next(err);
  }
});

function buildOptimisedUrl(stops, order) {
  const ordered   = order ? order.map(i => stops[i]) : stops;
  const origin    = `${DEPOT.lat},${DEPOT.lng}`;
  const waypoints = ordered.map(s => `${s.customers.lat},${s.customers.lng}`).join('%7C');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${origin}&waypoints=${waypoints}&travelmode=driving`;
}

function buildBasicUrl(stops) {
  const geocoded = stops.filter(s => s.customers?.lat);
  if (!geocoded.length) return null;
  const origin    = `${DEPOT.lat},${DEPOT.lng}`;
  const waypoints = geocoded.map(s => `${s.customers.lat},${s.customers.lng}`).join('%7C');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${origin}&waypoints=${waypoints}&travelmode=driving`;
}

export default router;
