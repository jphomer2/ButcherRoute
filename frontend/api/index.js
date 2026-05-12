import express         from 'express';
import cors            from 'cors';
import rateLimit       from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

import parseRoutes    from '../server/routes/parse.js';
import customersRoutes from '../server/routes/customers.js';
import driversRoutes  from '../server/routes/drivers.js';
import runsRoutes     from '../server/routes/runs.js';
import optimiseRoutes from '../server/routes/optimise.js';

import { logger }         from '../server/lib/logger.js';
import { allBreakerStatus } from '../server/lib/circuit-breaker.js';
import { makeUserClient } from '../server/lib/supabase.js';

import { requestLogger } from '../server/middleware/request-logger.js';
import { errorHandler }  from '../server/middleware/error-handler.js';
import { requestTimeout } from '../server/middleware/timeout.js';

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '64kb' }));
app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
app.use(requestLogger);
app.use(requestTimeout(20_000));

// Global IP-based rate limit — defence against abuse / credential stuffing
// NOTE: in-memory per Vercel instance; for true global limiting use Upstash Redis
app.use(rateLimit({
  windowMs:         60_000,
  max:              120,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests — please slow down.' },
  skip: (req) => req.path === '/api/health',
}));

// ── Public routes ─────────────────────────────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  const checks = { db: 'unknown', breakers: allBreakerStatus() };
  try {
    const sb = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );
    const { error } = await sb.from('companies').select('id').limit(1);
    checks.db = error ? 'degraded' : 'ok';
  } catch {
    checks.db = 'error';
  }

  const healthy = checks.db !== 'error';
  res.status(healthy ? 200 : 503).json({
    status:  healthy ? 'ok' : 'degraded',
    time:    new Date().toISOString(),
    checks,
  });
});

// ── Auth middleware ───────────────────────────────────────────────────────────

// Anon client — for JWT verification only (auth.getUser)
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

// Service client — for users table lookup in auth middleware (bypasses RLS)
const serviceClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

app.use(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid session' });

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

// ── Debug endpoint ────────────────────────────────────────────────────────────

app.get('/api/debug', async (req, res) => {
  const sb = makeUserClient(req.accessToken);
  const { data, error } = await sb.from('customers').select('id').eq('active', true);
  res.json({
    userId:        req.userId,
    email:         req.userEmail,
    companyId:     req.companyId,
    customerCount: data?.length ?? null,
    queryError:    error?.message ?? null,
    breakers:      allBreakerStatus(),
    v: 6,
  });
});

// ── Customers list (user-JWT-scoped) ──────────────────────────────────────────

app.get('/api/customers', async (req, res, next) => {
  try {
    const sb = makeUserClient(req.accessToken);
    const { data, error } = await sb
      .from('customers')
      .select('id, name, name_aliases, postcode, delivery_notes, lat, lng, address, contact_name, phone')
      .eq('active', true)
      .order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// ── Authenticated route handlers ──────────────────────────────────────────────

app.use('/api/parse',     parseRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/drivers',   driversRoutes);
app.use('/api/runs',      runsRoutes);
app.use('/api/optimise',  optimiseRoutes);

// ── Centralised error handler (must be last) ──────────────────────────────────

app.use(errorHandler);

// ── Graceful shutdown (local dev / non-serverless) ────────────────────────────

function shutdown(signal) {
  logger.info({ type: 'shutdown', signal });
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export default app;
