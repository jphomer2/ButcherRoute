import { logger } from '../lib/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const ms    = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    logger[level]({
      type:       'http',
      method:     req.method,
      path:       req.path,
      status:     res.statusCode,
      ms,
      company_id: req.companyId || undefined,
      req_id:     req.headers['x-vercel-id'] || req.headers['x-request-id'] || undefined,
    });
  });

  next();
}
