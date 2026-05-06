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
  // Fallback: use the only/first company in the system
  try {
    const { data } = await supabase.from('companies').select('id').limit(1).single();
    return data?.id ?? null;
  } catch { return null; }
}

const router = Router();

async function geocode(address, postcode) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const query = encodeURIComponent(`${address || ''} ${postcode || ''} UK`.trim());
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
    const r = await Promise.race([
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`),
      timeout,
    ]);
    const json = await r.json();
    if (json.status === 'OK' && json.results[0]) {
      const { lat, lng } = json.results[0].geometry.location;
      return { lat, lng };
    }
  } catch {}
  return null;
}

router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, name_aliases, postcode, delivery_notes, lat, lng, address, contact_name, phone')
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
  const { name, contact_name, phone, address, postcode, delivery_notes, name_aliases } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const company_id = await getCompanyId(req.headers.authorization);

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: name.trim(),
      contact_name: contact_name || null,
      phone: phone || null,
      address: address || null,
      postcode: postcode || null,
      delivery_notes: delivery_notes || null,
      name_aliases: name_aliases || null,
      lat: null,
      lng: null,
      company_id,
      active: true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const { name_aliases, ...rest } = req.body;
  const patch = { ...rest };
  if (name_aliases !== undefined) patch.name_aliases = name_aliases;

  if (patch.address !== undefined || patch.postcode !== undefined) {
    if (!patch.lat && !patch.lng) {
      const existing = await supabase.from('customers').select('address, postcode').eq('id', req.params.id).single();
      const addr = patch.address ?? existing.data?.address;
      const pc   = patch.postcode ?? existing.data?.postcode;
      const coords = await geocode(addr, pc);
      if (coords) { patch.lat = coords.lat; patch.lng = coords.lng; }
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .update(patch)
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
