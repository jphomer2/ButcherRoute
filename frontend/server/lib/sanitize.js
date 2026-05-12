// Strip C0/C1 control characters except \n \r \t
const CTRL_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;

/**
 * Sanitize a free-text order message:
 * - Remove dangerous control characters
 * - Normalise line endings to \n
 * - Hard-cap at 5 000 characters
 * - Trim leading/trailing whitespace
 */
export function sanitizeMessage(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(CTRL_RE, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .slice(0, 5_000)
    .trim();
}

/**
 * Sanitize a short string field (name, postcode, etc.)
 */
export function sanitizeField(text, maxLen = 500) {
  if (typeof text !== 'string') return text;
  return text.replace(CTRL_RE, '').slice(0, maxLen).trim();
}
