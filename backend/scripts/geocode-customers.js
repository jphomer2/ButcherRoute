import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

function cleanPostcode(raw) {
  if (!raw) return null;
  // Fix common OCR/data-entry errors (letter O instead of zero)
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, ' ').replace(/O(?=\d|$)/g, '0');
  // Basic UK postcode pattern check
  if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(cleaned)) return cleaned;
  return null;
}

async function geocodeBatch(postcodes) {
  const res = await fetch('https://api.postcodes.io/postcodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcodes }),
  });
  const json = await res.json();
  const map = {};
  for (const item of json.result || []) {
    if (item.result) {
      map[item.query.replace(/\s/g, '').toUpperCase()] = {
        lat: item.result.latitude,
        lng: item.result.longitude,
      };
    }
  }
  return map;
}

async function main() {
  // 1. Geocode the depot
  console.log('Geocoding depot: CM17 9JH');
  const depotRes = await fetch('https://api.postcodes.io/postcodes/CM179JH');
  const depotJson = await depotRes.json();
  if (depotJson.result) {
    console.log(`  Depot: lat=${depotJson.result.latitude}, lng=${depotJson.result.longitude}`);
    console.log('  Add to .env: DEPOT_LAT=' + depotJson.result.latitude);
    console.log('  Add to .env: DEPOT_LNG=' + depotJson.result.longitude);
  }

  // 2. Load all customers
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, name, postcode');

  if (error) { console.error('DB error:', error.message); process.exit(1); }
  console.log(`\nLoaded ${customers.length} customers`);

  // 3. Extract valid postcodes
  const toGeocode = customers
    .map(c => ({ id: c.id, name: c.name, postcode: cleanPostcode(c.postcode) }))
    .filter(c => c.postcode);

  const skipped = customers.filter(c => !cleanPostcode(c.postcode));
  console.log(`Geocodable: ${toGeocode.length} | No postcode: ${skipped.length}`);
  if (skipped.length) console.log('  Skipped:', skipped.map(c => c.name).join(', '));

  // 4. Batch geocode (postcodes.io allows up to 100 per request)
  const postcodes = toGeocode.map(c => c.postcode);
  console.log('\nCalling postcodes.io...');
  const geoMap = await geocodeBatch(postcodes);

  // 5. Update each customer in Supabase
  let updated = 0, failed = 0;
  for (const c of toGeocode) {
    const key = c.postcode.replace(/\s/g, '').toUpperCase();
    const coords = geoMap[key];
    if (!coords) {
      console.log(`  ✗ Not found: ${c.name} (${c.postcode})`);
      failed++;
      continue;
    }
    const { error: upErr } = await supabase
      .from('customers')
      .update({ lat: coords.lat, lng: coords.lng })
      .eq('id', c.id);
    if (upErr) {
      console.log(`  ✗ DB error for ${c.name}: ${upErr.message}`);
      failed++;
    } else {
      console.log(`  ✓ ${c.name} → ${coords.lat}, ${coords.lng}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated} | Failed: ${failed} | No postcode: ${skipped.length}`);
}

main().catch(console.error);
