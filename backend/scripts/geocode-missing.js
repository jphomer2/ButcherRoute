import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Customers with no postcode — best address we have for each
const ADDRESSES = {
  'ashes':                        'Burton End, Bury Lodge Lane, Stansted, Essex, CM24 8UD',
  'Garnon & Bushes':              'Garnon Bushes, Coppersale, Epping, Essex',
  'Java Coffee House':            'High Street, Hoddesdon, Hertfordshire',
  'Lockdown pizza Ltd/ Host':     '7 Market Square, Bishop Stortford, CM23 3UT',
  'Lomo':                         '25A St Andrew Street, Hertford, Hertfordshire',
  'Mulberry HOuse':               'Ongar Road, High Ongar, Essex',
  'pavillion Rouge':              '474 Great West Road, Hounslow, TW5 0TA',
  'Rainbow And Dove':             'Hastingwood Road, Hastingwood, Essex',
  'Spencers':                     'High Street, Putney, London, SW15',
  'The Goat':                     'Hertford Heath, Hertford, Hertfordshire',
  'The SIbthorpe Arms':           'Welham Green, Hatfield, Hertfordshire',
  'The Woodman and Olive':        '20 West End Road, Broxbourne, Hertfordshire',
  'City pubs Group PLC - The Bridge': '204 Castelnau Lane, London, SW13 3DW',
  'Felstead School':              'Felsted School, Felsted, Essex, CM6 3LL',
  'Felsted school':               'Felsted School, Felsted, Essex, CM6 3LL',
  'Village Pork (Smithfield) Co. Ltd': 'Smithfield Market, London, EC1A 9PS',
  'Eton Mess':                    'Eton, Windsor, Berkshire',
};

async function geocode(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}&region=gb`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === 'OK' && json.results[0]) {
    const loc = json.results[0].geometry.location;
    const postcode = json.results[0].address_components
      .find(c => c.types.includes('postal_code'))?.long_name || null;
    return { lat: loc.lat, lng: loc.lng, postcode };
  }
  return null;
}

async function main() {
  for (const [name, address] of Object.entries(ADDRESSES)) {
    const coords = await geocode(address);
    if (!coords) {
      console.log(`MISS|${name}`);
      continue;
    }
    console.log(`HIT|${name}|${coords.lat}|${coords.lng}|${coords.postcode || ''}`);
  }
}

main().catch(console.error);
