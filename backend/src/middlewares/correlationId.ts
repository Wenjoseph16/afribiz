import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function correlationId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  req.headers['x-correlation-id'] = id;
  res.setHeader('X-Correlation-ID', id);
  next();
}
