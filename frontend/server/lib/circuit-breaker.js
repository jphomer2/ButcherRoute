const FAILURE_THRESHOLD = 5;
const OPEN_DURATION_MS  = 30_000;
const HALF_OPEN_SUCCESS = 2;

export class CircuitOpenError extends Error {
  constructor(name) {
    super(`Service unavailable: circuit open for "${name}"`);
    this.name   = 'CircuitOpenError';
    this.status = 503;
  }
}

class CircuitBreaker {
  constructor(name) {
    this.name             = name;
    this.state            = 'CLOSED';
    this.failures         = 0;
    this.lastFailureAt    = null;
    this.halfOpenWins     = 0;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureAt < OPEN_DURATION_MS) throw new CircuitOpenError(this.name);
      this.state        = 'HALF_OPEN';
      this.halfOpenWins = 0;
    }

    try {
      const result = await fn();
      this._win();
      return result;
    } catch (err) {
      this._fail();
      throw err;
    }
  }

  _win() {
    if (this.state === 'HALF_OPEN') {
      if (++this.halfOpenWins >= HALF_OPEN_SUCCESS) {
        this.state    = 'CLOSED';
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  _fail() {
    this.failures++;
    this.lastFailureAt = Date.now();
    if (this.state === 'HALF_OPEN' || this.failures >= FAILURE_THRESHOLD) {
      this.state = 'OPEN';
    }
  }

  get status() { return this.state; }
}

// Module-level singletons — survive warm Vercel invocations
const registry = new Map();
export function getBreaker(name) {
  if (!registry.has(name)) registry.set(name, new CircuitBreaker(name));
  return registry.get(name);
}

export function allBreakerStatus() {
  const out = {};
  for (const [name, b] of registry) out[name] = b.state;
  return out;
}
