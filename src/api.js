const BASE = import.meta.env.VITE_API_URL || '/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  health:        ()            => req('GET',   '/health'),
  customers:     ()            => req('GET',   '/customers'),
  searchCustomers: (q)         => req('GET',   `/customers/search?q=${encodeURIComponent(q)}`),
  parseMessage:  (body)        => req('POST',  '/parse/message', body),
  getRuns:       (date)        => req('GET',   `/runs${date ? `?date=${date}` : ''}`),
  getRun:        (id)          => req('GET',   `/runs/${id}`),
  createRun:     (body)        => req('POST',  '/runs', body),
  updateRun:     (id, body)    => req('PATCH', `/runs/${id}`, body),
  getStops:      (runId)       => req('GET',   `/runs/${runId}/stops`),
  updateStop:    (id, body)    => req('PATCH',  `/runs/stops/${id}`, body),
  deleteStop:    (id)          => req('DELETE', `/runs/stops/${id}`),
  optimise:      (date)        => req('POST',  '/optimise', { delivery_date: date }),
  deleteRun:     (id)          => req('DELETE', `/runs/${id}`),
  clearDate:     (date)        => req('DELETE', `/runs?date=${date}`),
  dispatchRun:   (id)          => req('POST',   `/runs/${id}/dispatch`),
};
