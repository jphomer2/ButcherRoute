import { supabase } from './supabase.js';

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString());
  } catch { return null; }
}

export async function getCompanyId(authHeader) {
  const token = authHeader?.replace('Bearer ', '');
  if (token) {
    try {
      const userId = parseJwt(token)?.sub;
      if (userId) {
        const { data } = await supabase.from('users').select('company_id').eq('id', userId).single();
        if (data?.company_id) return data.company_id;
      }
    } catch {}
  }
  try {
    const { data } = await supabase.from('companies').select('id').order('created_at').limit(1).single();
    return data?.id ?? null;
  } catch { return null; }
}
