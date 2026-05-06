import { createClient } from '@supabase/supabase-js';

const url  = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
// Service role key bypasses RLS — required for trusted server-side writes
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = serviceKey || anonKey;

if (!url || !key) {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_ANON_KEY not set — database routes will fail until configured.');
}
if (!serviceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key. Add/save operations may fail if RLS is enabled.');
}

export const supabaseUrl  = url  || 'https://placeholder.supabase.co';
export const supabaseAnon = anonKey || 'placeholder';

export const supabase = createClient(supabaseUrl, key || 'placeholder');

// Creates a per-request client that acts as the authenticated user (for RLS-safe reads)
export function supabaseAsUser(authHeader) {
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return supabase;
  return createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
