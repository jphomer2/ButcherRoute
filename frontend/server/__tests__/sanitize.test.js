import { describe, it, expect } from 'vitest';
import { sanitizeMessage, sanitizeField } from '../lib/sanitize.js';

describe('sanitizeMessage', () => {
  it('preserves normal order text', () => {
    const msg = 'Morning all:\nMagpie - 20 cases\nFunky Monk - 15 cases';
    expect(sanitizeMessage(msg)).toBe(msg);
  });

  it('strips C0 control characters', () => {
    const msg = 'hello\x01\x07world';
    expect(sanitizeMessage(msg)).toBe('helloworld');
  });

  it('preserves newlines and tabs', () => {
    const msg = 'line1\nline2\ttabbed';
    expect(sanitizeMessage(msg)).toBe('line1\nline2\ttabbed');
  });

  it('normalises \\r\\n to \\n', () => {
    expect(sanitizeMessage('line1\r\nline2')).toBe('line1\nline2');
  });

  it('normalises standalone \\r to \\n', () => {
    expect(sanitizeMessage('line1\rline2')).toBe('line1\nline2');
  });

  it('truncates at 5 000 characters', () => {
    const long = 'a'.repeat(6000);
    expect(sanitizeMessage(long)).toHaveLength(5000);
  });

  it('trims whitespace', () => {
    expect(sanitizeMessage('  hello  ')).toBe('hello');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeMessage(null)).toBe('');
    expect(sanitizeMessage(undefined)).toBe('');
    expect(sanitizeMessage(42)).toBe('');
  });
});

describe('sanitizeField', () => {
  it('strips control characters from short fields', () => {
    expect(sanitizeField('Magpie\x00 Pub')).toBe('Magpie Pub');
  });

  it('respects custom maxLen', () => {
    expect(sanitizeField('abcdef', 3)).toBe('abc');
  });

  it('returns non-string input unchanged', () => {
    expect(sanitizeField(null)).toBeNull();
    expect(sanitizeField(42)).toBe(42);
  });
});
