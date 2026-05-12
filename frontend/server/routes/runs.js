import { Router } from 'express';
import { makeUserClient } from '../lib/supabase.js';

const router = Router();

router.use((req, _res, next) => { req.sb = makeUserClient(req.accessToken); next(); });

router.get('/', async (req, res) => {
  const { sb } = req;
  const { date } = req.query;
  let query = sb
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .eq('company_id', req.companyId)
    .order('delivery_date', { ascending: false });

  if (date) query = query.eq('delivery_date', date);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required' });

  // Find runs for this company+date to scope stop deletion
  const { data: runs } = await req.sb.from('runs').select('id').eq('delivery_date', date).eq('company_id', req.companyId);
  const runIds = (runs || []).map(r => r.id);

  if (runIds.length) {
    await req.sb.from('delivery_stops').delete().in('run_id', runIds);
  }
  // Scope message deletion to only messages referenced by this company's runs
  const { error: e2 } = runIds.length
    ? await req.sb.from('whatsapp_messages').delete().in('id',
        (await req.sb.from('delivery_stops').select('message_id').in('run_id', runIds)).data?.map(s => s.message_id).filter(Boolean) || []
      )
    : { error: null };
  const { error: e3 } = await req.sb.from('runs').delete().eq('delivery_date', date).eq('company_id', req.companyId);

  if (e2 || e3) {
    return res.status(500).json({ error: (e2 || e3).message });
  }

  res.status(204).end();
});

router.get('/stops/:stopId', async (req, res) => {
  const { data, error } = await req.sb
    .from('delivery_stops')
    .select('*, customers(name, address, postcode, lat, lng)')
    .eq('id', req.params.stopId)
    .single();

  if (error) return res.status(404).json({ error: 'Stop not found' });
  res.json(data);
});

router.patch('/stops/:stopId', async (req, res) => {
  // Verify stop belongs to this company via its run
  const { data: stop } = await req.sb
    .from('delivery_stops').select('run_id').eq('id', req.params.stopId).single();
  if (!stop) return res.status(404).json({ error: 'Stop not found' });
  const { data: run } = await req.sb
    .from('runs').select('id').eq('id', stop.run_id).eq('company_id', req.companyId).single();
  if (!run) return res.status(403).json({ error: 'Forbidden' });

  const { data, error } = await req.sb
    .from('delivery_stops')
    .update(req.body)
    .eq('id', req.params.stopId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/stops/:stopId', async (req, res) => {
  // Verify stop belongs to this company via its run
  const { data: stop } = await req.sb
    .from('delivery_stops').select('run_id').eq('id', req.params.stopId).single();
  if (!stop) return res.status(404).json({ error: 'Stop not found' });
  const { data: run } = await req.sb
    .from('runs').select('id').eq('id', stop.run_id).eq('company_id', req.companyId).single();
  if (!run) return res.status(403).json({ error: 'Forbidden' });

  const { error } = await req.sb
    .from('delivery_stops').delete().eq('id', req.params.stopId);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

router.get('/:id', async (req, res) => {
  const { data: run, error: runErr } = await req.sb
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .eq('id', req.params.id)
    .eq('company_id', req.companyId)
    .single();

  if (runErr) return res.status(404).json({ error: 'Run not found' });

  const { data: stops, error: stopsErr } = await req.sb
    .from('delivery_stops')
    .select('*, customers(name, address, postcode, lat, lng, delivery_notes)')
    .eq('run_id', req.params.id)
    .order('route_sequence');

  if (stopsErr) return res.status(500).json({ error: stopsErr.message });

  res.json({ ...run, stops });
});

router.post('/', async (req, res) => {
  const { delivery_date, driver_id } = req.body;
  if (!delivery_date) return res.status(400).json({ error: 'delivery_date required' });

  const { data, error } = await req.sb
    .from('runs')
    .insert({ delivery_date, driver_id: driver_id || null, status: 'building', company_id: req.companyId })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/:id', async (req, res) => {
  const { data: run } = await req.sb.from('runs').select('id').eq('id', req.params.id).eq('company_id', req.companyId).single();
  if (!run) return res.status(404).json({ error: 'Run not found' });

  await req.sb.from('delivery_stops').delete().eq('run_id', req.params.id);
  await req.sb.from('runs').delete().eq('id', req.params.id);

  res.status(204).end();
});

router.patch('/:id', async (req, res) => {
  const { data, error } = await req.sb
    .from('runs')
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('company_id', req.companyId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/dispatch', async (req, res) => {
  const { data: run, error: runErr } = await req.sb
    .from('runs')
    .select('*, driver(name, whatsapp_number, van_plate)')
    .eq('id', req.params.id)
    .eq('company_id', req.companyId)
    .single();

  if (runErr || !run) return res.status(404).json({ error: 'Run not found' });
  if (!run.route_url) return res.status(400).json({ error: 'Run has no route URL — optimise first' });

  await req.sb.from('runs').update({ status: 'dispatched', dispatched_at: new Date().toISOString() }).eq('id', run.id);
  res.json({ ok: true });
});

router.get('/:id/stops', async (req, res) => {
  const { data: run } = await req.sb.from('runs').select('id').eq('id', req.params.id).eq('company_id', req.companyId).single();
  if (!run) return res.status(404).json({ error: 'Run not found' });

  const { data, error } = await req.sb
    .from('delivery_stops')
    .select('*, customers(name, address, postcode, lat, lng)')
    .eq('run_id', req.params.id)
    .order('route_sequence');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
