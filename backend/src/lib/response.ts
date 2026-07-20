import { Response } from 'express';
import type { ApiResponse } from '@afribiz/shared';

export function sendError(res: Response, statusCode: number, error: string, data?: any) {
  const body: ApiResponse<any> = { success: false, error };
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  res.status(statusCode).json(body);
}
