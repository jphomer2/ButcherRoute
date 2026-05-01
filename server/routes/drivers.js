import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('driver')
    .select('id, name, whatsapp_number, van_plate, vehicle_reg, phone, active')
    .eq('active', true)
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { name, phone, whatsapp_number, vehicle_reg } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await supabase
    .from('driver')
    .insert({ name: name.trim(), phone: phone || null, whatsapp_number: whatsapp_number || null, vehicle_reg: vehicle_reg || null, van_plate: vehicle_reg || null, active: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const patch = { ...req.body };
  if (patch.vehicle_reg !== undefined) patch.van_plate = patch.vehicle_reg;

  const { data, error } = await supabase
    .from('driver')
    .update(patch)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('driver')
    .update({ active: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
