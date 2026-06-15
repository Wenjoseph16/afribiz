import { Request, Response, NextFunction } from 'express';
import { AppError, catchAsyncErrors } from './errorHandler';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

/**
 * Generic validation middleware using Zod
 */
export const validateBody = (schema: ZodSchema) => {
  return catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new AppError(
          errors.length > 0
            ? `${errors[0].field}: ${errors[0].message}`
            : 'Validation failed',
          400
        );
      }
      throw error;
    }
  });
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new AppError(
          errors.length > 0
            ? `${errors[0].field}: ${errors[0].message}`
            : 'Validation failed',
          400
        );
      }
      throw error;
    }
  });
};

/**
 * Pagination validation middleware
 */
export const validatePagination = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

    req.query.page = page.toString();
    req.query.limit = limit.toString();

    next();
  }
);
 