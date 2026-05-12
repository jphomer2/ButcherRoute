import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitOpenError } from '../lib/circuit-breaker.js';

// Import a fresh breaker for each test by using a unique name
let nameCounter = 0;
async function freshBreaker() {
  const { getBreaker } = await import('../lib/circuit-breaker.js');
  return getBreaker(`test-${++nameCounter}`);
}

describe('CircuitBreaker', () => {
  it('starts CLOSED and passes calls through', async () => {
    const breaker = await freshBreaker();
    const fn = vi.fn().mockResolvedValue('result');
    const res = await breaker.call(fn);
    expect(res).toBe('result');
    expect(breaker.status).toBe('CLOSED');
  });

  it('opens after FAILURE_THRESHOLD consecutive failures', async () => {
    const breaker = await freshBreaker();
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 5; i++) {
      await expect(breaker.call(fn)).rejects.toThrow('fail');
    }

    expect(breaker.status).toBe('OPEN');
  });

  it('throws CircuitOpenError while OPEN without calling fn', async () => {
    const breaker = await freshBreaker();
    const fail = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 5; i++) await expect(breaker.call(fail)).rejects.toThrow();

    const fn = vi.fn().mockResolvedValue('ok');
    await expect(breaker.call(fn)).rejects.toThrow(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('transitions to HALF_OPEN after open duration and allows one probe', async () => {
    const breaker = await freshBreaker();
    const fail = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 5; i++) await expect(breaker.call(fail)).rejects.toThrow();

    // Manually backdating lastFailureAt so the open window has "expired"
    breaker.lastFailureAt = Date.now() - 35_000;

    const fn = vi.fn().mockResolvedValue('ok');
    const res = await breaker.call(fn);
    expect(res).toBe('ok');
    expect(breaker.status).toBe('HALF_OPEN');
  });

  it('closes again after HALF_OPEN_SUCCESS consecutive successes', async () => {
    const breaker = await freshBreaker();
    const fail = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 5; i++) await expect(breaker.call(fail)).rejects.toThrow();
    breaker.lastFailureAt = Date.now() - 35_000;

    const fn = vi.fn().mockResolvedValue('ok');
    await breaker.call(fn);        // 1st success in HALF_OPEN
    await breaker.call(fn);        // 2nd success → should close
    expect(breaker.status).toBe('CLOSED');
  });

  it('re-opens immediately if probe fails in HALF_OPEN', async () => {
    const breaker = await freshBreaker();
    const fail = vi.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 5; i++) await expect(breaker.call(fail)).rejects.toThrow();
    breaker.lastFailureAt = Date.now() - 35_000;

    await expect(breaker.call(fail)).rejects.toThrow();
    expect(breaker.status).toBe('OPEN');
  });
});
