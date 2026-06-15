import { Request, Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { prisma } from '../lib/db';

export const healthCheck = catchAsyncErrors(async (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'connected' ? 200 : 503;

  res.status(status).json({
    success: dbStatus === 'connected',
    message: dbStatus === 'connected' ? 'Le serveur fonctionne' : 'Base de données indisponible',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    node: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});
