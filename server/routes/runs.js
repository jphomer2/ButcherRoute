import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { date } = req.query;
  let query = supabase
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .order('delivery_date', { ascending: false });

  if (date) query = query.eq('delivery_date', date);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required' });

  const { error: e1 } = await supabase.from('delivery_stops').delete().eq('delivery_date', date);
  const { error: e2 } = await supabase.from('whatsapp_messages').delete().eq('delivery_date', date);
  const { error: e3 } = await supabase.from('runs').delete().eq('delivery_date', date);

  if (e1 || e2 || e3) {
    return res.status(500).json({ error: (e1 || e2 || e3).message });
  }

  res.status(204).end();
});

router.get('/stops/:stopId', async (req, res) => {
  const { data, error } = await supabase
    .from('delivery_stops')
    .select('*, customers(name, address, postcode, lat, lng)')
    .eq('id', req.params.stopId)
    .single();

  if (error) return res.status(404).json({ error: 'Stop not found' });
  res.json(data);
});

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

router.delete('/stops/:stopId', async (req, res) => {
  const { error } = await supabase
    .from('delivery_stops')
    .delete()
    .eq('id', req.params.stopId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

router.get('/:id', async (req, res) => {
  const { data: run, error: runErr } = await supabase
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .eq('id', req.params.id)
    .single();

  if (runErr) return res.status(404).json({ error: 'Run not found' });

  const { data: stops, error: stopsErr } = await supabase
    .from('delivery_stops')
    .select('*, customers(name, address, postcode, lat, lng, delivery_notes)')
    .eq('delivery_date', run.delivery_date)
    .order('route_sequence');

  if (stopsErr) return res.status(500).json({ error: stopsErr.message });

  res.json({ ...run, stops });
});

router.post('/', async (req, res) => {
  const { delivery_date, driver_id } = req.body;
  if (!delivery_date) return res.status(400).json({ error: 'delivery_date required' });

  const { data, error } = await supabase
    .from('runs')
    .insert({ delivery_date, driver_id: driver_id || null, status: 'building' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/:id', async (req, res) => {
  const { data: run } = await supabase.from('runs').select('delivery_date').eq('id', req.params.id).single();
  if (!run) return res.status(404).json({ error: 'Run not found' });

  await supabase.from('delivery_stops').delete().eq('delivery_date', run.delivery_date);
  await supabase.from('whatsapp_messages').delete().eq('delivery_date', run.delivery_date);
  await supabase.from('runs').delete().eq('id', req.params.id);

  res.status(204).end();
});

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

router.post('/:id/dispatch', async (req, res) => {
  const { data: run, error: runErr } = await supabase
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .eq('id', req.params.id)
    .single();

  if (runErr || !run) return res.status(404).json({ error: 'Run not found' });
  if (!run.route_url) return res.status(400).json({ error: 'Run has no route URL — optimise first' });

  await supabase.from('runs').update({ status: 'dispatched', dispatched_at: new Date().toISOString() }).eq('id', run.id);
  res.json({ ok: true });
});

router.get('/:id/stops', async (req, res) => {
  const { data: run } = await supabase.from('runs').select('delivery_date').eq('id', req.params.id).single();
  if (!run) return res.status(404).json({ error: 'Run not found' });

  const { data, error } = await supabase
    .from('delivery_stops')
    .select('*, customers(name, address, postcode, lat, lng)')
    .eq('delivery_date', run.delivery_date)
    .order('route_sequence');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
