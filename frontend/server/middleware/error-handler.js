import { logger } from '../lib/logger.js';
import { ValidationError } from '../lib/validate.js';
import { CircuitOpenError } from '../lib/circuit-breaker.js';

// Must be 4-arg for Express to treat it as an error handler
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error({
      type:       'unhandled_error',
      error:      err.message,
      stack:      err.stack,
      path:       req?.path,
      company_id: req?.companyId,
    });
  }

  if (res.headersSent) return;

  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, field: err.field });
  }

  if (err instanceof CircuitOpenError) {
    return res.status(503).json({ error: 'Service temporarily unavailable — please try again shortly.' });
  }

  // Anthropic SDK errors
  if (err.name === 'APIError' || err.name === 'AnthropicError' || err.name === 'APIConnectionTimeoutError') {
    return res.status(502).json({ error: 'AI service error. Please try again.' });
  }

  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : (err.message || 'Unknown error'),
  });
}
