import { createClient } from '@supabase/supabase-js';

const url        = process.env.SUPABASE_URL;
const anonKey    = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key        = serviceKey || anonKey;

if (!url || !key) {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_ANON_KEY not set — database routes will fail until configured.');
}
if (!serviceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key. Writes may fail if RLS is enabled.');
}

export const supabase = createClient(
  url  || 'https://placeholder.supabase.co',
  key  || 'placeholder'
);
