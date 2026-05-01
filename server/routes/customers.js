import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, name_aliases, postcode, delivery_notes, lat, lng')
    .eq('active', true)
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, postcode, delivery_notes, lat, lng')
    .eq('active', true)
    .ilike('name', `%${q}%`)
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { name, contact_name, phone, address, postcode, delivery_notes } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await supabase
    .from('customers')
    .insert({ name: name.trim(), contact_name: contact_name || null, phone: phone || null, address: address || null, postcode: postcode || null, delivery_notes: delivery_notes || null, active: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('customers')
    .update({ active: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
