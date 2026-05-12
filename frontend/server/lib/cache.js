class TtlCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.exp) { this.store.delete(key); return undefined; }
    return entry.value;
  }

  set(key, value) {
    this.store.set(key, { value, exp: Date.now() + this.ttlMs });
  }

  delete(key) { this.store.delete(key); }
  clear()     { this.store.clear(); }
  size()      { return this.store.size; }
}

// Customer list: 60 s — avoids re-querying on every parse within a warm function instance
export const customerCache = new TtlCache(60_000);

// Export class for tests / custom caches
export { TtlCache };
