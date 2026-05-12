const sleep = ms => new Promise(r => setTimeout(r, ms));

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 529]);
const RETRYABLE_CODES    = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND']);

function isRetryable(err) {
  const status = err.status || err.statusCode;
  if (status) return RETRYABLE_STATUSES.has(status);
  return RETRYABLE_CODES.has(err.code);
}

/**
 * Retry fn up to `retries` additional attempts with exponential backoff + jitter.
 * Only retries on transient errors (5xx, 429, network faults).
 */
export async function withRetry(fn, { retries = 3, baseDelay = 250, label = 'op' } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries || !isRetryable(err)) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
      await sleep(delay);
    }
  }
}
