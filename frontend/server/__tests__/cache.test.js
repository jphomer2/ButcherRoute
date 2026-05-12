import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TtlCache } from '../lib/cache.js';

describe('TtlCache', () => {
  let cache;

  beforeEach(() => {
    cache = new TtlCache(500); // 500 ms TTL
  });

  it('stores and retrieves a value', () => {
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');
  });

  it('returns undefined for missing key', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires entries after TTL', async () => {
    cache.set('k', 'v');
    await new Promise(r => setTimeout(r, 550));
    expect(cache.get('k')).toBeUndefined();
  });

  it('delete removes the entry', () => {
    cache.set('k', 'v');
    cache.delete('k');
    expect(cache.get('k')).toBeUndefined();
  });

  it('clear removes all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('stores objects', () => {
    const obj = [{ id: '1', name: 'Magpie' }];
    cache.set('customers:abc', obj);
    expect(cache.get('customers:abc')).toEqual(obj);
  });

  it('overwriting a key resets TTL', async () => {
    cache.set('k', 'old');
    await new Promise(r => setTimeout(r, 300));
    cache.set('k', 'new');
    await new Promise(r => setTimeout(r, 300));
    // At 600ms total — old entry would have expired but new one hasn't
    expect(cache.get('k')).toBe('new');
  });
});
