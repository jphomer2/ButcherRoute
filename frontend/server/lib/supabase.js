import { createClient } from '@supabase/supabase-js';

const url        = process.env.SUPABASE_URL        || 'https://placeholder.supabase.co';
const anonKey    = process.env.SUPABASE_ANON_KEY   || 'placeholder';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service client — bypasses RLS entirely. Use for admin operations.
export const supabase = createClient(url, serviceKey || anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// User-scoped client — runs as the authenticated user, RLS applies correctly.
// Use this in route handlers where req.accessToken is available.
export function makeUserClient(accessToken) {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth:   { persistSession: false, autoRefreshToken: false },
  });
}
