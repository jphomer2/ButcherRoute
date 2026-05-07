import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../lib/supabase.js';

const router = Router();

const SYSTEM_PROMPT = `You are a dispatch assistant for a UK meat wholesale depot (James Burden Ltd).
Your job is to parse WhatsApp order messages and extract structured delivery stops.

Rules:
- ONLY extract customers that are explicitly named in THIS message. Do not infer, guess, or recall customers from previous messages or your general knowledge.
- Extract one entry per customer mentioned.
- "quantity" = number of cases (default unit). If pallets are mentioned, set unit="pallets".
- If a message says "EARLY" or specifies a time like "06:00" or "7am", set early=true and capture the time (24hr format HH:MM) in early_time.
- If a message says "tbc", "not sure", "to be confirmed", set tbc=true and quantity=null.
- Preserve any special delivery instructions in notes. Do not add notes for things not mentioned in the message.
- customer_name_raw should be exactly as written in the message — the system will match to the database.
- If a line is clearly not an order (greetings, sign-offs, general chat), ignore it entirely.

Return ONLY valid JSON — no explanation, no markdown. Format:
{
  "stops": [
    {
      "customer_name_raw": "string",
      "quantity": number | null,
      "unit": "cases" | "pallets",
      "early": boolean,
      "early_time": "HH:MM" | null,
      "tbc": boolean,
      "notes": "string | null"
    }
  ]
}`;

function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function nameAppearsInMessage(rawName, message) {
  const msgLower = message.toLowerCase();
  const tokens = rawName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/).filter(t => t.length > 2);
  if (tokens.length === 0) return true;
  return tokens.some(t => msgLower.includes(t));
}

function matchCustomer(rawName, customers) {
  const needle = normalise(rawName);
  let match = customers.find(c => normalise(c.name) === needle);
  if (match) return { customer: match, confidence: 1.0 };
  match = customers.find(c =>
    Array.isArray(c.name_aliases) && c.name_aliases.some(a => normalise(a) === needle)
  );
  if (match) return { customer: match, confidence: 0.95 };
  match = customers.find(c =>
    normalise(c.name).includes(needle) || needle.includes(normalise(c.name))
  );
  if (match) return { customer: match, confidence: 0.75 };
  return { customer: null, confidence: 0 };
}

const EXAMPLE_STOPS = [
  { name: 'Magpie',          quantity: 20, tbc: false },
  { name: 'Funky Monk',      quantity: 15, tbc: false },
  { name: 'The Black Horse', quantity: 12, tbc: false },
  { name: 'Garnon & Bushes', quantity: 18, tbc: false },
];

const EXAMPLE_MESSAGE = `Morning all, orders for tomorrow:
Magpie - 20 cases
Funky Monk - 15 cases
The Black Horse - 12 cases
Garnon & Bushes - 18 cases`;

// GET /api/parse/load-example?date=YYYY-MM-DD
router.get('/load-example', async (req, res) => {
  req.body = { delivery_date: req.query.date };
  return loadExampleHandler(req, res);
});

// POST /api/parse/load-example
router.post('/load-example', async (req, res) => {
  return loadExampleHandler(req, res);
});

async function loadExampleHandler(req, res) {
  const companyId = req.companyId;
  const { delivery_date } = req.body;
  const date = delivery_date || new Date().toISOString().split('T')[0];

  // Load matching customers scoped to this company
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, delivery_notes')
    .in('name', EXAMPLE_STOPS.map(s => s.name))
    .eq('active', true)
    .eq('company_id', companyId);

  // Find or create a run for this company + date
  let { data: run } = await supabase
    .from('runs')
    .select('id')
    .eq('delivery_date', date)
    .eq('company_id', companyId)
    .maybeSingle();

  if (!run) {
    const { data: newRun } = await supabase
      .from('runs')
      .insert({ delivery_date: date, status: 'building', company_id: companyId })
      .select('id')
      .single();
    run = newRun;
  } else {
    // Wipe existing stops for this run and reset state
    await supabase.from('delivery_stops').delete().eq('run_id', run.id);
    await supabase.from('runs')
      .update({ status: 'building', route_url: null, total_miles: null, est_drive_minutes: null })
      .eq('id', run.id);
  }

  const rows = EXAMPLE_STOPS.map((s, idx) => {
    const customer = (customers || []).find(c => c.name === s.name);
    return {
      run_id:            run.id,
      delivery_date:     date,
      customer_id:       customer?.id || null,
      customer_name_raw: s.name,
      quantity:          s.quantity,
      unit:              'cases',
      early:             false,
      early_time:        null,
      tbc:               s.tbc,
      notes:             customer?.delivery_notes || null,
      matched:           !!customer,
      match_confidence:  customer ? 1.0 : 0,
      route_sequence:    idx + 1,
      company_id:        companyId,
    };
  });

  const { data: insertedStops, error } = await supabase
    .from('delivery_stops')
    .insert(rows)
    .select('*, customers(name, address, postcode, lat, lng)');

  if (error) return res.status(500).json({ error: error.message });
  res.json({ run_id: run?.id || null, stops: insertedStops, reset: true });
}

// POST /api/parse/message
router.post('/message', async (req, res) => {
  const { message, delivery_date } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // Intercept /example — load demo stops directly, no Claude needed
  const msgNorm = message.trim().toLowerCase();
  if (msgNorm === '/example' || msgNorm === EXAMPLE_MESSAGE.trim().toLowerCase()) {
    req.body = { delivery_date };
    return loadExampleHandler(req, res);
  }

  // Rate limit: max 60 AI parse calls per hour per company
  try {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('whatsapp_messages')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', req.companyId)
      .gte('received_at', hourAgo);
    if (count >= 60) {
      return res.status(429).json({ error: 'Rate limit reached — maximum 60 order parses per hour. Try again shortly.' });
    }
  } catch (_) { /* allow through if check fails */ }

  const date = delivery_date || new Date().toISOString().split('T')[0];

  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server' });
  const anthropic = new Anthropic({ apiKey: key });

  try {
    const { data: msgRow, error: msgErr } = await supabase
      .from('whatsapp_messages')
      .insert({ body: message, delivery_date: date, status: 'pending', from_number: 'manual', company_id: req.companyId })
      .select()
      .single();

    if (msgErr) return res.status(500).json({ error: msgErr.message });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    });

    let parsed;
    try {
      const raw = response.content[0].text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(raw);
    } catch {
      await supabase.from('whatsapp_messages').update({ status: 'failed' }).eq('id', msgRow.id);
      return res.status(422).json({ error: 'Claude returned invalid JSON', raw: response.content[0].text });
    }

    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, name_aliases, postcode, lat, lng, delivery_notes')
      .eq('active', true)
      .eq('company_id', req.companyId);

    const { data: activeRun } = await supabase
      .from('runs')
      .select('id')
      .eq('delivery_date', date)
      .eq('company_id', req.companyId)
      .maybeSingle();

    let existingNames = new Set();
    let existingStopCount = 0;

    if (activeRun) {
      const { data: existingStops } = await supabase
        .from('delivery_stops')
        .select('customer_name_raw')
        .eq('run_id', activeRun.id);
      existingNames = new Set((existingStops || []).map(s => normalise(s.customer_name_raw)));
      existingStopCount = existingStops?.length || 0;
    }

    const parsedStops = parsed.stops
      .filter(stop => nameAppearsInMessage(stop.customer_name_raw, message))
      .filter(stop => !existingNames.has(normalise(stop.customer_name_raw)));

    if (!parsedStops.length) {
      await supabase.from('whatsapp_messages').update({ status: 'parsed' }).eq('id', msgRow.id);
      return res.json({
        message_id: msgRow.id,
        run_id: activeRun?.id || null,
        stops: [],
        unmatched: [],
        input_tokens: 0,
        skipped: 'all stops already exist for this date',
      });
    }

    // Ensure run exists before inserting stops
    let runId = activeRun?.id || null;
    if (!runId) {
      const { data: newRun } = await supabase
        .from('runs')
        .insert({ delivery_date: date, status: 'building', company_id: req.companyId })
        .select('id')
        .single();
      runId = newRun?.id || null;
    }

    const stops = parsedStops.map((stop, idx) => {
      const { customer, confidence } = matchCustomer(stop.customer_name_raw, customers);
      return {
        run_id:            runId,
        message_id:        msgRow.id,
        customer_id:       customer?.id || null,
        delivery_date:     date,
        customer_name_raw: stop.customer_name_raw,
        quantity:          stop.quantity,
        unit:              stop.unit || 'cases',
        early:             stop.early || false,
        early_time:        stop.early_time || null,
        tbc:               stop.tbc || false,
        notes:             stop.notes || customer?.delivery_notes || null,
        matched:           !!customer,
        match_confidence:  confidence,
        route_sequence:    existingStopCount + idx + 1,
        company_id:        req.companyId,
      };
    });

    const { data: insertedStops, error: stopsErr } = await supabase
      .from('delivery_stops')
      .insert(stops)
      .select('*, customers(name, address, postcode, lat, lng)');

    if (stopsErr) return res.status(500).json({ error: stopsErr.message });

    await supabase.from('whatsapp_messages').update({ status: 'parsed' }).eq('id', msgRow.id);

    res.json({
      message_id: msgRow.id,
      run_id: runId,
      stops: insertedStops,
      unmatched: insertedStops.filter(s => !s.matched).map(s => s.customer_name_raw),
      input_tokens: response.usage.input_tokens,
    });
  } catch (err) {
    console.error('Parse error:', err.status, err.name, err.message);
    res.status(500).json({ error: err.message, type: err.name, status: err.status });
  }
});

export default router;
