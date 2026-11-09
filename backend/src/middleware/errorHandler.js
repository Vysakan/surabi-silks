import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.details) body.error.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body' },
    });
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProd ? 'Internal server error' : err.message,
    },
  });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: 'The requested endpoint does not exist' },
  });
}
