import { Router } from 'express';
import twilio from 'twilio';
import { supabase } from '../lib/supabase.js';
import { getCompanyId } from '../lib/auth.js';

const router = Router();

// GET /api/runs — list runs (optionally filter by date)
router.get('/', async (req, res) => {
  const company_id = await getCompanyId(req.headers.authorization);
  const { date } = req.query;
  let query = supabase
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .order('delivery_date', { ascending: false });
  if (date) query = query.eq('delivery_date', date);
  if (company_id) query = query.eq('company_id', company_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/runs?date=YYYY-MM-DD — clear everything for a date
router.delete('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required' });
  const company_id = await getCompanyId(req.headers.authorization);

  // Delete stops first (FK: delivery_stops.message_id -> whatsapp_messages)
  let q1 = supabase.from('delivery_stops').delete().eq('delivery_date', date);
  if (company_id) q1 = q1.eq('company_id', company_id);
  const { error: e1 } = await q1;

  let q2 = supabase.from('whatsapp_messages').delete().eq('delivery_date', date);
  if (company_id) q2 = q2.eq('company_id', company_id);
  const { error: e2 } = await q2;

  let q3 = supabase.from('runs').delete().eq('delivery_date', date);
  if (company_id) q3 = q3.eq('company_id', company_id);
  const { error: e3 } = await q3;

  if (e1 || e2 || e3) return res.status(500).json({ error: (e1 || e2 || e3).message });
  res.status(204).end();
});

// GET /api/runs/:id — run with all stops
router.get('/:id', async (req, res) => {
  const { data: run, error: runErr } = await supabase
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .eq('id', req.params.id)
    .single();
  if (runErr) return res.status(404).json({ error: 'Run not found' });

  let stopsQuery = supabase
    .from('delivery_stops')
    .select('*, customers(name, address, postcode, lat, lng, delivery_notes)')
    .eq('delivery_date', run.delivery_date)
    .order('route_sequence');
  if (run.company_id) stopsQuery = stopsQuery.eq('company_id', run.company_id);

  const { data: stops, error: stopsErr } = await stopsQuery;
  if (stopsErr) return res.status(500).json({ error: stopsErr.message });
  res.json({ ...run, stops });
});

// POST /api/runs — create a new run for a date
router.post('/', async (req, res) => {
  const { delivery_date, driver_id } = req.body;
  if (!delivery_date) return res.status(400).json({ error: 'delivery_date required' });
  const company_id = await getCompanyId(req.headers.authorization);
  const { data, error } = await supabase
    .from('runs')
    .insert({ delivery_date, driver_id: driver_id || null, status: 'building', company_id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/runs/:id — delete a run and all its stops
router.delete('/:id', async (req, res) => {
  const { data: run } = await supabase
    .from('runs')
    .select('delivery_date, company_id')
    .eq('id', req.params.id)
    .single();
  if (!run) return res.status(404).json({ error: 'Run not found' });

  let q1 = supabase.from('delivery_stops').delete().eq('delivery_date', run.delivery_date);
  let q2 = supabase.from('whatsapp_messages').delete().eq('delivery_date', run.delivery_date);
  if (run.company_id) {
    q1 = q1.eq('company_id', run.company_id);
    q2 = q2.eq('company_id', run.company_id);
  }
  await q1;
  await q2;
  await supabase.from('runs').delete().eq('id', req.params.id);
  res.status(204).end();
});

// PATCH /api/runs/:id — update run (status, route_url, etc.)
router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('runs')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/runs/:id/dispatch — send route to driver via SMS
router.post('/:id/dispatch', async (req, res) => {
  const { data: run, error: runErr } = await supabase
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .eq('id', req.params.id)
    .single();
  if (runErr || !run) return res.status(404).json({ error: 'Run not found' });
  if (!run.route_url) return res.status(400).json({ error: 'Run has no route URL — optimise first' });

  let stopsQuery = supabase
    .from('delivery_stops')
    .select('customer_name_raw, quantity, unit, early, early_time, tbc')
    .eq('delivery_date', run.delivery_date)
    .order('route_sequence');
  if (run.company_id) stopsQuery = stopsQuery.eq('company_id', run.company_id);
  const { data: stops } = await stopsQuery;

  const driver = run.driver;
  if (!driver?.whatsapp_number) return res.status(400).json({ error: 'No driver assigned to this run' });

  const dateLabel = new Date(run.delivery_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const earlyStops = (stops || []).filter(s => s.early);
  const miles = run.total_miles ? `${run.total_miles} miles` : '';
  const mins = run.est_drive_minutes ? `~${run.est_drive_minutes} mins drive` : '';

  let msg = `ButcherRoute — ${dateLabel}\n`;
  msg += `${(stops || []).length} stops`;
  if (miles) msg += ` · ${miles}`;
  if (mins) msg += ` · ${mins}`;
  msg += `\n\n`;
  if (earlyStops.length) {
    msg += `⚡ EARLY COLLECTIONS:\n`;
    earlyStops.forEach(s => { msg += `  ${s.customer_name_raw}${s.early_time ? ` @ ${s.early_time}` : ''}\n`; });
    msg += `\n`;
  }
  msg += `Route:\n${run.route_url}`;

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: msg,
      from: process.env.TWILIO_FROM_NUMBER,
      to: driver.whatsapp_number,
    });
    await supabase.from('runs').update({ status: 'dispatched', dispatched_at: new Date().toISOString() }).eq('id', run.id);
    res.json({ ok: true, sent_to: driver.whatsapp_number, driver: driver.name });
  } catch (err) {
    console.error('Twilio error:', err.message);
    res.status(500).json({ error: `Failed to send message: ${err.message}` });
  }
});

// PATCH /api/runs/stops/:stopId — update a single stop
router.patch('/stops/:stopId', async (req, res) => {
  const { data, error } = await supabase
    .from('delivery_stops')
    .update(req.body)
    .eq('id', req.params.stopId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/runs/stops/:stopId — remove a stop
router.delete('/stops/:stopId', async (req, res) => {
  const { error } = await supabase
    .from('delivery_stops')
    .delete()
    .eq('id', req.params.stopId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// GET /api/runs/:id/stops — stops for a run
router.get('/:id/stops', async (req, res) => {
  const { data: run } = await supabase
    .from('runs')
    .select('delivery_date, company_id')
    .eq('id', req.params.id)
    .single();
  if (!run) return res.status(404).json({ error: 'Run not found' });

  let query = supabase
    .from('delivery_stops')
    .select('*, customers(name, address, postcode, lat, lng)')
    .eq('delivery_date', run.delivery_date)
    .order('route_sequence');
  if (run.company_id) query = query.eq('company_id', run.company_id);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
