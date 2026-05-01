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

// Health check is public
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// All other /api/* routes require a valid Supabase session
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid session' });
  next();
});

app.use('/api/parse', parseRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/optimise', optimiseRoutes);

export default app;
