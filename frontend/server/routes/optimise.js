import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

const DEPOT = {
  lat: parseFloat(process.env.DEPOT_LAT) || 51.750589,
  lng: parseFloat(process.env.DEPOT_LNG) || 0.157336,
};

router.post('/', async (req, res) => {
  const { delivery_date } = req.body;
  if (!delivery_date) return res.status(400).json({ error: 'delivery_date required' });

  // Find the run for this company + date
  const { data: run } = await supabase
    .from('runs')
    .select('id')
    .eq('delivery_date', delivery_date)
    .eq('company_id', req.companyId)
    .maybeSingle();

  if (!run) return res.status(404).json({ error: 'No run found for this date' });

  const { data: stops, error } = await supabase
    .from('delivery_stops')
    .select('id, customer_name_raw, tbc, customers(name, lat, lng)')
    .eq('run_id', run.id)
    .eq('tbc', false);

  if (error) return res.status(500).json({ error: error.message });

  const geocoded    = stops.filter(s => s.customers?.lat && s.customers?.lng);
  const ungeocodable = stops.filter(s => !s.customers?.lat || !s.customers?.lng);

  if (geocoded.length < 2) {
    return res.json({ message: 'Not enough geocoded stops to optimise', maps_url: buildBasicUrl(stops) });
  }

  const waypoints = geocoded.map(s => ({
    location: { latLng: { latitude: s.customers.lat, longitude: s.customers.lng } },
    via: false,
  }));

  const body = {
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
    const routeRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.distanceMeters,routes.duration',
      },
      body: JSON.stringify(body),
    });

    const routeJson = await routeRes.json();

    if (routeJson.routes?.[0]) {
      const route = routeJson.routes[0];
      optimisedOrder = route.optimizedIntermediateWaypointIndex;
      totalMetres    = route.distanceMeters;
      totalSeconds   = parseInt(route.duration?.replace('s', '') || '0');
    }
  } catch (e) {
    console.error('Routes API error:', e.message);
  }

  if (optimisedOrder) {
    const updates = optimisedOrder.map((origIdx, newSeq) => ({
      id: geocoded[origIdx].id,
      route_sequence: newSeq + 1,
    }));

    for (const u of updates) {
      await supabase.from('delivery_stops').update({ route_sequence: u.route_sequence }).eq('id', u.id);
    }

    for (let i = 0; i < ungeocodable.length; i++) {
      await supabase.from('delivery_stops')
        .update({ route_sequence: optimisedOrder.length + i + 1 })
        .eq('id', ungeocodable[i].id);
    }
  }

  const miles   = totalMetres ? Math.round(totalMetres / 1609.344 * 10) / 10 : null;
  const minutes = totalSeconds ? Math.round(totalSeconds / 60) : null;
  const mapsUrl = buildOptimisedUrl(geocoded, optimisedOrder);

  await supabase.from('runs')
    .update({
      status: 'ready',
      total_miles: miles,
      est_drive_minutes: minutes,
      route_url: mapsUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', run.id);

  res.json({
    stops_optimised: geocoded.length,
    stops_skipped:   ungeocodable.length,
    total_miles:     miles,
    est_drive_minutes: minutes,
    maps_url:        mapsUrl,
    optimised_order: optimisedOrder,
  });
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
