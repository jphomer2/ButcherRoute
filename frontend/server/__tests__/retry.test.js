import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../lib/retry.js';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 503 and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('503'), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error('503'), { status: 503 }))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, { retries: 3, baseDelay: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries on 429 (rate limit)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('429'), { status: 429 }))
      .mockResolvedValue('done');
    const result = await withRetry(fn, { retries: 2, baseDelay: 1 });
    expect(result).toBe('done');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on 400 (client error)', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));
    await expect(withRetry(fn, { retries: 3, baseDelay: 1 })).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on 401 (auth error)', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('unauthorized'), { status: 401 }));
    await expect(withRetry(fn, { retries: 3, baseDelay: 1 })).rejects.toThrow('unauthorized');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on ETIMEDOUT network error', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }))
      .mockResolvedValue('recovered');
    const result = await withRetry(fn, { retries: 2, baseDelay: 1 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting all retries', async () => {
    const err = Object.assign(new Error('always fails'), { status: 503 });
    const fn  = vi.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { retries: 2, baseDelay: 1 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3); // 1 attempt + 2 retries
  });

  it('retries on 529 (Anthropic overload)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('overloaded'), { status: 529 }))
      .mockResolvedValue('parsed');
    const result = await withRetry(fn, { retries: 2, baseDelay: 1 });
    expect(result).toBe('parsed');
  });
});
