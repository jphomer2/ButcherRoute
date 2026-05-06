import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString());
  } catch { return null; }
}

async function getCompanyId(authHeader) {
  const token = authHeader?.replace('Bearer ', '');
  if (token) {
    try {
      const userId = parseJwt(token)?.sub;
      if (userId) {
        const { data } = await supabase.from('users').select('company_id').eq('id', userId).single();
        if (data?.company_id) return data.company_id;
      }
    } catch {}
  }
  try {
    const { data } = await supabase.from('companies').select('id').limit(1).single();
    return data?.id ?? null;
  } catch { return null; }
}

const router = Router();

// GET /api/drivers
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('driver')
    .select('id, name, whatsapp_number, van_plate, vehicle_reg, phone, active')
    .eq('active', true)
    .order('name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/drivers
router.post('/', async (req, res) => {
  const { name, phone, whatsapp_number, vehicle_reg } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const company_id = await getCompanyId(req.headers.authorization);

  const { data, error } = await supabase
    .from('driver')
    .insert({ name: name.trim(), phone: phone || null, whatsapp_number: whatsapp_number || null, vehicle_reg: vehicle_reg || null, van_plate: vehicle_reg || null, company_id, active: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/drivers/:id
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

// DELETE /api/drivers/:id — soft delete
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('driver')
    .update({ active: false })
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
