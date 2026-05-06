import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

const DEPOT = {
  lat: parseFloat(process.env.DEPOT_LAT) || 51.750589,
  lng: parseFloat(process.env.DEPOT_LNG) || 0.157336,
};

// POST /api/optimise
router.post('/', async (req, res) => {
  const { delivery_date } = req.body;
  if (!delivery_date) return res.status(400).json({ error: 'delivery_date required' });

  // 1. Load stops with customer coords
  const { data: stops, error: stopsErr } = await supabase
    .from('delivery_stops')
    .select('id, customer_name_raw, tbc, customers(name, lat, lng)')
    .eq('delivery_date', delivery_date)
    .eq('tbc', false);

  if (stopsErr) return res.status(500).json({ error: stopsErr.message });
  if (!stops?.length) return res.status(400).json({ error: 'No stops found for this date' });

  // Normalise: Supabase returns the joined row as an object (many-to-one).
  // Guard against it occasionally coming back as a single-item array.
  const normalised = stops.map(s => ({
    ...s,
    customers: Array.isArray(s.customers) ? s.customers[0] ?? null : s.customers,
  }));

  const geocoded     = normalised.filter(s => s.customers?.lat && s.customers?.lng);
  const ungeocodable = normalised.filter(s => !s.customers?.lat || !s.customers?.lng);

  console.log(`Optimise ${delivery_date}: ${stops.length} stops, ${geocoded.length} geocoded, ${ungeocodable.length} without coords`);

  if (geocoded.length < 2) {
    const basicUrl = buildBasicUrl(geocoded);
    console.log('Not enough geocoded stops — returning basic URL:', basicUrl ? 'yes' : 'null');
    return res.json({
      stops_optimised: 0,
      stops_skipped: ungeocodable.length,
      total_miles: null,
      est_drive_minutes: null,
      maps_url: basicUrl,
      message: `Only ${geocoded.length} stop(s) have addresses — need at least 2 to optimise. Check customers have postcodes saved.`,
    });
  }

  // 2. Call Google Maps Routes API
  const waypoints = geocoded.map(s => ({
    location: { latLng: { latitude: parseFloat(s.customers.lat), longitude: parseFloat(s.customers.lng) } },
    via: false,
  }));

  const routeBody = {
    origin:      { location: { latLng: { latitude: DEPOT.lat, longitude: DEPOT.lng } } },
    destination: { location: { latLng: { latitude: DEPOT.lat, longitude: DEPOT.lng } } },
    intermediates: waypoints,
    travelMode: 'DRIVE',
    optimizeWaypointOrder: true,
    routingPreference: 'TRAFFIC_AWARE',
  };

  let optimisedOrder = null;
  let totalMetres    = null;
  let totalSeconds   = null;

  try {
    const routeRes  = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.distanceMeters,routes.duration',
      },
      body: JSON.stringify(routeBody),
    });

    const routeJson = await routeRes.json();
    console.log('Routes API status:', routeRes.status, '| routes:', routeJson.routes?.length ?? 0, '| error:', routeJson.error?.message ?? 'none');

    if (routeJson.routes?.[0]) {
      const route    = routeJson.routes[0];
      optimisedOrder = Array.isArray(route.optimizedIntermediateWaypointIndex) ? route.optimizedIntermediateWaypointIndex : null;
      totalMetres    = route.distanceMeters ?? null;
      totalSeconds   = route.duration ? parseInt(route.duration.replace('s', '')) : null;
      console.log('Optimised order:', optimisedOrder, '| metres:', totalMetres, '| seconds:', totalSeconds);
    }
  } catch (e) {
    console.error('Routes API fetch error:', e.message);
  }

  // 3. Update route_sequence in delivery_stops
  if (optimisedOrder) {
    for (let newSeq = 0; newSeq < optimisedOrder.length; newSeq++) {
      const origIdx = optimisedOrder[newSeq];
      if (origIdx < geocoded.length) {
        await supabase.from('delivery_stops')
          .update({ route_sequence: newSeq + 1 })
          .eq('id', geocoded[origIdx].id);
      }
    }
    for (let i = 0; i < ungeocodable.length; i++) {
      await supabase.from('delivery_stops')
        .update({ route_sequence: optimisedOrder.length + i + 1 })
        .eq('id', ungeocodable[i].id);
    }
  }

  // 4. Build maps URL
  const miles   = totalMetres  ? Math.round(totalMetres / 1609.344 * 10) / 10 : null;
  const minutes = totalSeconds ? Math.round(totalSeconds / 60) : null;

  let mapsUrl = null;
  try {
    mapsUrl = buildOptimisedUrl(geocoded, optimisedOrder);
    console.log('Maps URL built:', mapsUrl ? mapsUrl.substring(0, 80) + '...' : 'null');
  } catch (e) {
    console.error('buildOptimisedUrl error:', e.message);
    mapsUrl = buildBasicUrl(geocoded);
  }

  // 5. Save to runs table
  const { error: runUpdateErr } = await supabase
    .from('runs')
    .update({
      status: 'ready',
      total_miles: miles,
      est_drive_minutes: minutes,
      route_url: mapsUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('delivery_date', delivery_date);

  if (runUpdateErr) {
    console.error('Failed to update run:', runUpdateErr.message);
  } else {
    console.log('Run updated — route_url saved:', !!mapsUrl);
  }

  res.json({
    stops_optimised:  geocoded.length,
    stops_skipped:    ungeocodable.length,
    total_miles:      miles,
    est_drive_minutes: minutes,
    maps_url:         mapsUrl,
    optimised_order:  optimisedOrder,
  });
});

function buildOptimisedUrl(stops, order) {
  const ordered   = (order && order.length) ? order.map(i => stops[i]).filter(Boolean) : stops;
  const origin    = `${DEPOT.lat},${DEPOT.lng}`;
  const waypoints = ordered
    .map(s => `${parseFloat(s.customers.lat)},${parseFloat(s.customers.lng)}`)
    .join('%7C');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${origin}&waypoints=${waypoints}&travelmode=driving`;
}

function buildBasicUrl(stops) {
  if (!stops?.length) return null;
  const origin    = `${DEPOT.lat},${DEPOT.lng}`;
  const waypoints = stops
    .map(s => `${parseFloat(s.customers.lat)},${parseFloat(s.customers.lng)}`)
    .join('%7C');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${origin}&waypoints=${waypoints}&travelmode=driving`;
}

export default router;
