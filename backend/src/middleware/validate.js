import { ValidationError } from '../utils/AppError.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new ValidationError(details));
    }
    req.validated = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return validate(schema, 'query');
}
