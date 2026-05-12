import { Router }    from 'express';
import Anthropic      from '@anthropic-ai/sdk';
import { makeUserClient } from '../lib/supabase.js';
import { withRetry }      from '../lib/retry.js';
import { getBreaker }     from '../lib/circuit-breaker.js';
import { customerCache }  from '../lib/cache.js';
import { validateParseBody } from '../lib/validate.js';
import { sanitizeMessage }   from '../lib/sanitize.js';
import { logger }            from '../lib/logger.js';

const router = Router();
router.use((req, _res, next) => { req.sb = makeUserClient(req.accessToken); next(); });

const claudeBreaker = getBreaker('anthropic-claude');

// ── System prompt ─────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalise(str) {
  return str.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function nameAppearsInMessage(rawName, message) {
  const msgLower = message.toLowerCase();
  const tokens   = rawName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/).filter(t => t.length > 2);
  if (!tokens.length) return true;
  return tokens.some(t => msgLower.includes(t));
}

export function matchCustomer(rawName, customers) {
  const needle = normalise(rawName);
  let match = customers.find(c => normalise(c.name) === needle);
  if (match) return { customer: match, confidence: 1.0 };
  match = customers.find(c =>
    Array.isArray(c.name_aliases) && c.name_aliases.some(a => normalise(a) === needle),
  );
  if (match) return { customer: match, confidence: 0.95 };
  match = customers.find(c =>
    normalise(c.name).includes(needle) || needle.includes(normalise(c.name)),
  );
  if (match) return { customer: match, confidence: 0.75 };
  return { customer: null, confidence: 0 };
}

async function getCustomers(sb, companyId) {
  const cacheKey = `customers:${companyId}`;
  const cached   = customerCache.get(cacheKey);
  if (cached) return cached;

  const { data, error } = await sb
    .from('customers')
    .select('id, name, name_aliases, postcode, lat, lng, delivery_notes')
    .eq('active', true)
    .eq('company_id', companyId);

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  customerCache.set(cacheKey, data || []);
  return data || [];
}

// ── Example data ──────────────────────────────────────────────────────────────

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

// ── Load-example handler ──────────────────────────────────────────────────────

router.get('/load-example', async (req, res, next) => {
  req.body = { delivery_date: req.query.date };
  return loadExampleHandler(req, res, next);
});

router.post('/load-example', async (req, res, next) => {
  return loadExampleHandler(req, res, next);
});

async function loadExampleHandler(req, res, next) {
  try {
    const { sb }      = req;
    const companyId   = req.companyId;
    const date        = req.body?.delivery_date || new Date().toISOString().split('T')[0];

    const { data: customers } = await sb
      .from('customers')
      .select('id, name, delivery_notes')
      .in('name', EXAMPLE_STOPS.map(s => s.name))
      .eq('active', true)
      .eq('company_id', companyId);

    let { data: run } = await sb
      .from('runs')
      .select('id')
      .eq('delivery_date', date)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!run) {
      const { data: newRun, error: runErr } = await sb
        .from('runs')
        .insert({ delivery_date: date, status: 'building', company_id: companyId })
        .select('id')
        .single();
      if (runErr) throw Object.assign(new Error(runErr.message), { status: 500 });
      run = newRun;
    } else {
      await sb.from('delivery_stops').delete().eq('run_id', run.id);
      await sb.from('runs')
        .update({ status: 'building', route_url: null, total_miles: null, est_drive_minutes: null })
        .eq('id', run.id);
    }

    if (!run) throw Object.assign(new Error('Failed to create run'), { status: 500 });

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

    const { data: insertedStops, error } = await sb
      .from('delivery_stops')
      .insert(rows)
      .select('*, customers(name, address, postcode, lat, lng)');

    if (error) throw Object.assign(new Error(error.message), { status: 500 });
    res.json({ run_id: run.id, stops: insertedStops, reset: true });
  } catch (err) {
    next(err);
  }
}

// ── Parse message ─────────────────────────────────────────────────────────────

router.post('/message', async (req, res, next) => {
  try {
    // 1. Validate + sanitize input
    const { message: rawMessage, delivery_date } = validateParseBody(req.body);
    const message = sanitizeMessage(rawMessage);
    const { sb }  = req;
    const date    = delivery_date || new Date().toISOString().split('T')[0];

    // 2. /example shortcut
    const msgNorm = message.toLowerCase();
    if (msgNorm === '/example' || msgNorm === EXAMPLE_MESSAGE.trim().toLowerCase()) {
      req.body = { delivery_date: date };
      return loadExampleHandler(req, res, next);
    }

    // 3. Per-company rate limit (DB-backed, persists across instances)
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await sb
      .from('whatsapp_messages')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', req.companyId)
      .gte('received_at', hourAgo);
    if ((count ?? 0) >= 60) {
      return res.status(429).json({ error: 'Rate limit reached — maximum 60 parses per hour.' });
    }

    // 4. Idempotency: if the same message body was already parsed today for this company, return existing stops
    const { data: existing } = await sb
      .from('whatsapp_messages')
      .select('id')
      .eq('company_id', req.companyId)
      .eq('delivery_date', date)
      .eq('body', message)
      .eq('status', 'parsed')
      .maybeSingle();

    if (existing) {
      logger.info({ type: 'idempotent_parse', company_id: req.companyId, date });
      const { data: activeRun } = await sb.from('runs').select('id').eq('delivery_date', date).eq('company_id', req.companyId).maybeSingle();
      const stops = activeRun
        ? (await sb.from('delivery_stops').select('*, customers(name, address, postcode, lat, lng)').eq('run_id', activeRun.id)).data || []
        : [];
      return res.json({ message_id: existing.id, run_id: activeRun?.id || null, stops, idempotent: true });
    }

    // 5. Check Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) throw Object.assign(new Error('ANTHROPIC_API_KEY not configured'), { status: 500 });

    // 6. Record message row (pending)
    const { data: msgRow, error: msgErr } = await sb
      .from('whatsapp_messages')
      .insert({ body: message, delivery_date: date, status: 'pending', from_number: 'manual', company_id: req.companyId })
      .select()
      .single();
    if (msgErr) throw Object.assign(new Error(msgErr.message), { status: 500 });

    // 7. Call Claude with retry + circuit breaker
    let response;
    try {
      response = await claudeBreaker.call(() =>
        withRetry(
          () => new Anthropic({ apiKey }).messages.create({
            model:      'claude-sonnet-4-6',
            max_tokens: 1024,
            system:     SYSTEM_PROMPT,
            messages:   [{ role: 'user', content: message }],
          }),
          { retries: 2, baseDelay: 500, label: 'claude-parse' },
        )
      );
    } catch (err) {
      await sb.from('whatsapp_messages').update({ status: 'failed' }).eq('id', msgRow.id);
      throw err;
    }

    // 8. Parse Claude response
    let parsed;
    try {
      const raw = response.content[0].text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.stops)) throw new Error('Missing stops array');
    } catch {
      await sb.from('whatsapp_messages').update({ status: 'failed' }).eq('id', msgRow.id);
      return res.status(422).json({ error: 'AI returned unparseable response — please rephrase and retry.' });
    }

    // 9. Load customers (cached)
    const customers = await getCustomers(sb, req.companyId);

    // 10. Find or create run
    const { data: activeRun } = await sb
      .from('runs').select('id').eq('delivery_date', date).eq('company_id', req.companyId).maybeSingle();

    let existingNames = new Set();
    let existingStopCount = 0;
    if (activeRun) {
      const { data: existingStops } = await sb
        .from('delivery_stops').select('customer_name_raw').eq('run_id', activeRun.id);
      existingNames     = new Set((existingStops || []).map(s => normalise(s.customer_name_raw)));
      existingStopCount = existingStops?.length || 0;
    }

    const parsedStops = parsed.stops
      .filter(s => nameAppearsInMessage(s.customer_name_raw, message))
      .filter(s => !existingNames.has(normalise(s.customer_name_raw)));

    if (!parsedStops.length) {
      await sb.from('whatsapp_messages').update({ status: 'parsed' }).eq('id', msgRow.id);
      return res.json({ message_id: msgRow.id, run_id: activeRun?.id || null, stops: [], unmatched: [], input_tokens: 0, skipped: 'all stops already exist for this date' });
    }

    let runId = activeRun?.id || null;
    if (!runId) {
      const { data: newRun, error: runErr } = await sb
        .from('runs').insert({ delivery_date: date, status: 'building', company_id: req.companyId }).select('id').single();
      if (runErr) throw Object.assign(new Error(runErr.message), { status: 500 });
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

    const { data: insertedStops, error: stopsErr } = await sb
      .from('delivery_stops').insert(stops).select('*, customers(name, address, postcode, lat, lng)');
    if (stopsErr) throw Object.assign(new Error(stopsErr.message), { status: 500 });

    await sb.from('whatsapp_messages').update({ status: 'parsed' }).eq('id', msgRow.id);

    // Invalidate customer cache if a new unmatched name appeared (may have been added since last cache)
    if (insertedStops.some(s => !s.matched)) {
      customerCache.delete(`customers:${req.companyId}`);
    }

    logger.info({
      type:         'parse_complete',
      company_id:   req.companyId,
      date,
      stops:        insertedStops.length,
      unmatched:    insertedStops.filter(s => !s.matched).length,
      input_tokens: response.usage.input_tokens,
    });

    res.json({
      message_id:   msgRow.id,
      run_id:       runId,
      stops:        insertedStops,
      unmatched:    insertedStops.filter(s => !s.matched).map(s => s.customer_name_raw),
      input_tokens: response.usage.input_tokens,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
