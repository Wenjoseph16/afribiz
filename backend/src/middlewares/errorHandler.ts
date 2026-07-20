import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@afribiz/shared';
import { config } from '../config/env';
import { logger } from '../lib/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  data?: Record<string, any>;
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  data?: Record<string, any>;

  constructor(message: string, statusCode: number = 500, data?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const error = err as ApiError;
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erreur interne du serveur';
  const isProduction = config.NODE_ENV === 'production';

  // Log complet (toujours pour le debugging serveur)
  logger.error(`Error: ${message}`, {
    statusCode,
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id,
    stack: error.stack,
  });

  // Ne jamais exposer la stack trace en production
  const body: Record<string, unknown> = {
    success: false,
    error: isProduction && statusCode === 500 ? 'Erreur interne du serveur' : message,
  };

  if (error.data) {
    body.data = error.data;
  }

  // Ne pas exposer de détails sensibles en production pour les 500
  if (!isProduction && statusCode === 500) {
    body.stack = error.stack?.split('\n').slice(0, 5).join('\n');
  }

  res.status(statusCode).json(body);
};

export const catchAsyncErrors = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
