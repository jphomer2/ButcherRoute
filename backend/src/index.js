import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import parseRoutes from './routes/parse.js';
import customersRoutes from './routes/customers.js';
import driversRoutes from './routes/drivers.js';
import runsRoutes from './routes/runs.js';
import optimiseRoutes from './routes/optimise.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/parse', parseRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/runs', runsRoutes);
app.use('/api/optimise', optimiseRoutes);

app.get('/api/health', (_req, res) => {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  res.json({
    status: 'ok',
    version: 'v2-jwt-fix',
    time: new Date().toISOString(),
    anthropic_key_set: !!key,
    anthropic_key_prefix: key ? key.slice(0, 14) + '...' : null,
    anthropic_key_length: key ? key.length : 0,
  });
});

app.get('/api/health/supabase', async (_req, res) => {
  const { supabase } = await import('./lib/supabase.js');
  try {
    const { error } = await supabase.from('customers').select('id').limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message, hint: error.hint });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/health/anthropic', async (_req, res) => {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return res.status(500).json({ ok: false, error: 'ANTHROPIC_API_KEY not set' });
  try {
    const anthropic = new Anthropic({ apiKey: key });
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Reply with the single word: OK' }],
    });
    res.json({ ok: true, reply: msg.content[0].text });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`ButcherRoute API running on http://localhost:${PORT}`);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error('ANTHROPIC_API_KEY is NOT set');
  } else {
    console.log(`ANTHROPIC_API_KEY loaded: starts=${key.slice(0, 14)}... length=${key.length}`);
  }
});
