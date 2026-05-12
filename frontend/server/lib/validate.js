export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name   = 'ValidationError';
    this.field  = field || null;
    this.status = 400;
  }
}

function required(value, field) {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${field} is required`, field);
  }
  return value;
}

function maxLen(value, field, max) {
  if (typeof value === 'string' && value.length > max) {
    throw new ValidationError(`${field} must be ${max} characters or fewer`, field);
  }
  return value;
}

function isDateStr(value, field) {
  if (value === undefined || value === null) return value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(Date.parse(value))) {
    throw new ValidationError(`${field} must be a valid date in YYYY-MM-DD format`, field);
  }
  return value;
}

function isPositiveInt(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${field} must be a positive integer`, field);
  }
  return value;
}

// ── Route-specific validators ─────────────────────────────────────────────────

export function validateParseBody(body) {
  const { message, delivery_date } = body || {};
  required(message, 'message');
  if (typeof message !== 'string') throw new ValidationError('message must be a string', 'message');
  maxLen(message, 'message', 5_000);
  isDateStr(delivery_date, 'delivery_date');
  return { message: message.trim(), delivery_date: delivery_date || null };
}

export function validateOptimiseBody(body) {
  const { delivery_date } = body || {};
  required(delivery_date, 'delivery_date');
  isDateStr(delivery_date, 'delivery_date');
  return { delivery_date };
}

export function validateCustomerBody(body) {
  const { name } = body || {};
  required(name, 'name');
  if (typeof name !== 'string') throw new ValidationError('name must be a string', 'name');
  maxLen(name, 'name', 200);
  return body;
}

export { isDateStr, required, maxLen };
