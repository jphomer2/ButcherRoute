import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import parseRoutes from '../server/routes/parse.js';
import customersRoutes from '../server/routes/customers.js';
import driversRoutes from '../server/routes/drivers.js';
import runsRoutes from '../server/routes/runs.js';
import optimiseRoutes from '../server/routes/optimise.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

// Health check is public
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Anon client — used only for verifying JWTs (auth.getUser)
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Service client — bypasses RLS, used for users lookup in auth middleware
const serviceClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Auth middleware — runs before every route below
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid session' });

  // Use service client to look up company_id (bypasses RLS safely on server)
  const { data: userRow } = await serviceClient
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!userRow?.company_id) return res.status(403).json({ error: 'User has no company assigned' });

  req.userId      = user.id;
  req.userEmail   = user.email;
  req.accessToken = token;
  req.companyId   = userRow.company_id;
  next();
});

// Debug endpoint — v7
app.get('/api/debug', async (req, res) => {
  // Use user JWT so RLS restricts to their company
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${req.accessToken}` } },
  });
  const { data, error } = await sb.from('customers').select('id').eq('active', true);
  res.json({
    userId:        req.userId,
    email:         req.userEmail,
    companyId:     req.companyId,
    customerCount: data?.length ?? null,
    queryError:    error?.message ?? null,
    v: 5,
  });
});

// ── Customers list ──────────────────────────────────────────────────────────
// Uses the user's own JWT so Supabase's RLS policy (auth_users_read_own_customers)
// enforces company isolation at the database level — no server-side filter needed.
app.get('/api/customers', async (req, res) => {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${req.accessToken}` } },
  });
  const { data, error } = await sb
    .from('customers')
    .select('id, name, name_aliases, postcode, delivery_notes, lat, lng, address, contact_name, phone')
    .eq('active', true)
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.use('/api/parse', parseRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/optimise', optimiseRoutes);

export default app;
