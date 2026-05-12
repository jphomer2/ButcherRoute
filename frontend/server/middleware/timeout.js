/**
 * Sends a 503 if the handler hasn't responded within `ms` milliseconds.
 * Vercel hard-kills functions at 25s (Hobby) / 60s (Pro) — keep this under that.
 */
export function requestTimeout(ms = 20_000) {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ error: 'Request timed out — please try again.' });
      }
    }, ms);

    const clear = () => clearTimeout(timer);
    res.on('finish', clear);
    res.on('close',  clear);
    next();
  };
}
