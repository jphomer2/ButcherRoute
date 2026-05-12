import { Router } from 'express';
import { makeUserClient } from '../lib/supabase.js';

const router = Router();

router.use((req, _res, next) => { req.sb = makeUserClient(req.accessToken); next(); });

router.get('/', async (req, res) => {
  let query = req.sb
    .from('driver')
    .select('id, name, whatsapp_number, van_plate, vehicle_reg, phone, active')
    .eq('active', true)
    .order('name');
  if (req.companyId) query = query.eq('company_id', req.companyId);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { name, phone, whatsapp_number, vehicle_reg } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await req.sb
    .from('driver')
    .insert({
      name: name.trim(),
      phone: phone || null,
      whatsapp_number: whatsapp_number || null,
      vehicle_reg: vehicle_reg || null,
      van_plate: vehicle_reg || null,
      company_id: req.companyId,
      active: true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const patch = { ...req.body };
  if (patch.vehicle_reg !== undefined) patch.van_plate = patch.vehicle_reg;

  const { data, error } = await req.sb
    .from('driver')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await req.sb
    .from('driver')
    .update({ active: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
