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

router.post('/message', async (req, res) => {
  const { message, delivery_date } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const date = delivery_date || new Date().toISOString().split('T')[0];

  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server' });
  const anthropic = new Anthropic({ apiKey: key });

  try {
    const { data: msgRow, error: msgErr } = await supabase
      .from('whatsapp_messages')
      .insert({ body: message, delivery_date: date, status: 'pending', from_number: 'manual' })
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
      .eq('active', true);

    const { data: activeRun } = await supabase
      .from('runs')
      .select('id')
      .eq('delivery_date', date)
      .maybeSingle();

    let existingNames = new Set();
    let existingStopCount = 0;

    if (activeRun) {
      const { data: existingStops } = await supabase
        .from('delivery_stops')
        .select('customer_name_raw')
        .eq('delivery_date', date);
      existingNames = new Set((existingStops || []).map(s => normalise(s.customer_name_raw)));
      existingStopCount = existingStops?.length || 0;
    }

    const stops = parsed.stops
      .filter(stop => nameAppearsInMessage(stop.customer_name_raw, message))
      .filter(stop => !existingNames.has(normalise(stop.customer_name_raw)))
      .map((stop, idx) => {
        const { customer, confidence } = matchCustomer(stop.customer_name_raw, customers);
        return {
          message_id: msgRow.id,
          customer_id: customer?.id || null,
          delivery_date: date,
          customer_name_raw: stop.customer_name_raw,
          quantity: stop.quantity,
          unit: stop.unit || 'cases',
          early: stop.early || false,
          early_time: stop.early_time || null,
          tbc: stop.tbc || false,
          notes: stop.notes || customer?.delivery_notes || null,
          matched: !!customer,
          match_confidence: confidence,
          route_sequence: existingStopCount + idx + 1,
        };
      });

    if (!stops.length) {
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

    const { data: insertedStops, error: stopsErr } = await supabase
      .from('delivery_stops')
      .insert(stops)
      .select('*, customers(name, address, postcode, lat, lng)');

    if (stopsErr) return res.status(500).json({ error: stopsErr.message });

    await supabase.from('whatsapp_messages').update({ status: 'parsed' }).eq('id', msgRow.id);

    let runId = activeRun?.id || null;
    if (!runId) {
      const { data: newRun } = await supabase
        .from('runs')
        .insert({ delivery_date: date, status: 'building' })
        .select('id')
        .single();
      runId = newRun?.id || null;
    }

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
