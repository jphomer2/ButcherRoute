import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'butcherroute-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) { return { level: label }; },
  },
});

export function reqLogger(req) {
  return logger.child({
    req_id:     req.headers['x-vercel-id'] || req.headers['x-request-id'] || undefined,
    company_id: req.companyId,
  });
}
