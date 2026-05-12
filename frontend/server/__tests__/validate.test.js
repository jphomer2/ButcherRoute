import { describe, it, expect } from 'vitest';
import { validateParseBody, validateOptimiseBody, ValidationError } from '../lib/validate.js';

describe('validateParseBody', () => {
  it('accepts a valid message', () => {
    const result = validateParseBody({ message: 'Magpie - 20 cases', delivery_date: '2026-05-12' });
    expect(result.message).toBe('Magpie - 20 cases');
    expect(result.delivery_date).toBe('2026-05-12');
  });

  it('trims leading/trailing whitespace from message', () => {
    const { message } = validateParseBody({ message: '  hello  ' });
    expect(message).toBe('hello');
  });

  it('throws if message is missing', () => {
    expect(() => validateParseBody({})).toThrow(ValidationError);
    expect(() => validateParseBody({ message: '' })).toThrow(ValidationError);
  });

  it('throws if message is not a string', () => {
    expect(() => validateParseBody({ message: 42 })).toThrow(ValidationError);
  });

  it('throws if message exceeds 5 000 characters', () => {
    const long = 'x'.repeat(5001);
    expect(() => validateParseBody({ message: long })).toThrow(ValidationError);
  });

  it('accepts message without delivery_date', () => {
    const result = validateParseBody({ message: 'test' });
    expect(result.delivery_date).toBeNull();
  });

  it('throws on invalid delivery_date format', () => {
    expect(() => validateParseBody({ message: 'test', delivery_date: '12/05/2026' })).toThrow(ValidationError);
    expect(() => validateParseBody({ message: 'test', delivery_date: 'not-a-date' })).toThrow(ValidationError);
  });

  it('throws on out-of-range date', () => {
    expect(() => validateParseBody({ message: 'test', delivery_date: '2026-13-01' })).toThrow(ValidationError);
  });
});

describe('validateOptimiseBody', () => {
  it('accepts valid delivery_date', () => {
    const result = validateOptimiseBody({ delivery_date: '2026-05-12' });
    expect(result.delivery_date).toBe('2026-05-12');
  });

  it('throws if delivery_date is missing', () => {
    expect(() => validateOptimiseBody({})).toThrow(ValidationError);
  });

  it('throws if delivery_date is malformed', () => {
    expect(() => validateOptimiseBody({ delivery_date: '2026/05/12' })).toThrow(ValidationError);
  });
});

describe('ValidationError', () => {
  it('has correct shape', () => {
    const e = new ValidationError('bad input', 'message');
    expect(e.name).toBe('ValidationError');
    expect(e.field).toBe('message');
    expect(e.status).toBe(400);
  });
});
