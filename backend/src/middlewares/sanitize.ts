import { Request, Response, NextFunction } from 'express';
import xss, { IFilterXSSOptions } from 'xss';
import { logger } from '../lib/logger';

const xssOptions: IFilterXSSOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
};

function walkAndSanitize(obj: unknown): unknown {
  if (typeof obj === 'string') {
    const original = obj;
    const cleaned = xss(obj, xssOptions);
    if (original !== cleaned) {
      logger.debug('XSS detected and sanitized in input', {
        original: original.substring(0, 100),
      });
    }
    return cleaned;
  }

  if (Array.isArray(obj)) {
    return obj.map(walkAndSanitize);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = walkAndSanitize(value);
    }
    return sanitized;
  }

  return obj;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = walkAndSanitize(req.body) as typeof req.body;
  }
  if (req.query && typeof req.query === 'object') {
    req.query = walkAndSanitize(req.query) as typeof req.query;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = walkAndSanitize(req.params) as typeof req.params;
  }
  next();
}
