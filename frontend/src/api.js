import { supabase } from './lib/supabase';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function req(method, path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || err.message || res.statusText || `HTTP ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('Request timed out — check the backend is running and try again');
    throw e;
  }
}

export const api = {
  health:          ()            => req('GET',    '/health'),
  // Customers
  customers:       ()            => req('GET',    '/customers'),
  searchCustomers: (q)           => req('GET',    `/customers/search?q=${encodeURIComponent(q)}`),
  createCustomer:  (body)        => req('POST',   '/customers', body),
  updateCustomer:  (id, body)    => req('PATCH',  `/customers/${id}`, body),
  removeCustomer:  (id)          => req('DELETE', `/customers/${id}`),
  // Drivers
  drivers:         ()            => req('GET',    '/drivers'),
  createDriver:    (body)        => req('POST',   '/drivers', body),
  updateDriver:    (id, body)    => req('PATCH',  `/drivers/${id}`, body),
  removeDriver:    (id)          => req('DELETE', `/drivers/${id}`),
  // Runs & parsing
  parseMessage:    (body)        => req('POST',   '/parse/message', body),
  loadExample:     (date)        => req('POST',   '/parse/load-example', { delivery_date: date }),
  getRuns:         (date)        => req('GET',    `/runs${date ? `?date=${date}` : ''}`),
  getRun:          (id)          => req('GET',    `/runs/${id}`),
  createRun:       (body)        => req('POST',   '/runs', body),
  updateRun:       (id, body)    => req('PATCH',  `/runs/${id}`, body),
  getStops:        (runId)       => req('GET',    `/runs/${runId}/stops`),
  updateStop:      (id, body)    => req('PATCH',  `/runs/stops/${id}`, body),
  deleteStop:      (id)          => req('DELETE', `/runs/stops/${id}`),
  optimise:        (date)        => req('POST',   '/optimise', { delivery_date: date }),
  deleteRun:       (id)          => req('DELETE', `/runs/${id}`),
  clearDate:       (date)        => req('DELETE', `/runs?date=${date}`),
  dispatchRun:     (id)          => req('POST',   `/runs/${id}/dispatch`),
};
