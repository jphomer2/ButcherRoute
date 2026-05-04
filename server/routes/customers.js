import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

async function geocode(address, postcode) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const query = encodeURIComponent(`${address || ''} ${postcode || ''} UK`.trim());
  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`);
    const json = await r.json();
    if (json.status === 'OK' && json.results[0]) {
      const { lat, lng } = json.results[0].geometry.location;
      return { lat, lng };
    }
  } catch {}
  return null;
}

router.get('/', async (req, res) => {
  if (!req.companyId) return res.status(400).json({ error: 'Company not resolved' });

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, name_aliases, postcode, delivery_notes, lat, lng, address, contact_name, phone, company_id')
    .eq('active', true)
    .eq('company_id', req.companyId)
    .order('name');

  if (error) return res.status(500).json({ error: error.message });

  // Hard filter: guarantee only this company's customers are ever returned
  const safe = (data || []).filter(c => c.company_id === req.companyId);
  res.json(safe.map(({ company_id: _cid, ...rest }) => rest));
});

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, postcode, delivery_notes, lat, lng')
    .eq('active', true)
    .eq('company_id', req.companyId)
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
    .eq('company_id', req.companyId)
    .single();

  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { name, contact_name, phone, address, postcode, delivery_notes, name_aliases } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const coords = (address || postcode) ? await geocode(address, postcode) : null;

  const aliases = Array.isArray(name_aliases)
    ? name_aliases.filter(Boolean)
    : (typeof name_aliases === 'string' && name_aliases.trim() ? [name_aliases.trim()] : null);

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: name.trim(),
      contact_name: contact_name || null,
      phone: phone || null,
      address: address || null,
      postcode: postcode || null,
      delivery_notes: delivery_notes || null,
      name_aliases: aliases,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      active: true,
      company_id: req.companyId,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const patch = { ...req.body };
  if (patch.name_aliases !== undefined) {
    patch.name_aliases = Array.isArray(patch.name_aliases)
      ? patch.name_aliases.filter(Boolean)
      : (typeof patch.name_aliases === 'string' && patch.name_aliases.trim()
          ? patch.name_aliases.split(',').map(s => s.trim()).filter(Boolean)
          : null);
  }

  if (patch.address !== undefined || patch.postcode !== undefined) {
    if (!patch.lat && !patch.lng) {
      const existing = await supabase.from('customers').select('address, postcode').eq('id', req.params.id).eq('company_id', req.companyId).single();
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
    .eq('company_id', req.companyId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('customers')
    .update({ active: false })
    .eq('id', req.params.id)
    .eq('company_id', req.companyId);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
