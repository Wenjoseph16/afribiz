import { Request, Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { runAllChecks, checkDatabase, checkRedis, checkStorage } from '../services/healthService';

const HEALTH_VERSION = 'v1';

function buildHealthResponse(db: any, redis: any, storage: any, cron: any) {
  const isHealthy = db.status === 'connected';
  return {
    success: isHealthy,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    node: process.version,
    environment: process.env.NODE_ENV || 'development',
    services: { database: db, redis, storage, cron },
    version: HEALTH_VERSION,
  };
}

export const healthCheck = catchAsyncErrors(async (req: Request, res: Response) => {
  const { database: db, redis, storage, cron, isHealthy } = await runAllChecks();
  res.status(isHealthy ? 200 : 503).json({
    ...buildHealthResponse(db, redis, storage, cron),
    message: isHealthy ? 'Le serveur fonctionne' : 'Services critiques indisponibles',
  });
});

export const healthDetailed = catchAsyncErrors(async (req: Request, res: Response) => {
  const { database: db, redis, storage, cron } = await runAllChecks();
  res.status(db.status === 'connected' ? 200 : 503).json({
    ...buildHealthResponse(db, redis, storage, cron),
    platform: process.platform,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  });
});

export const healthDb = catchAsyncErrors(async (req: Request, res: Response) => {
  const db = await checkDatabase();
  res
    .status(db.status === 'connected' ? 200 : 503)
    .json({ success: db.status === 'connected', ...db });
});

export const healthRedis = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await checkRedis();
  res
    .status(result.status === 'connected' ? 200 : 503)
    .json({ success: result.status === 'connected', ...result });
});

export const healthStorage = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await checkStorage();
  res
    .status(result.status === 'connected' ? 200 : 503)
    .json({ success: result.status === 'connected', ...result });
});

/**
 * Statut de maintenance public — utilisé par la page /maintenance du frontend
 * pour détecter la fin de la maintenance (polling toutes les 15s).
 */
export const maintenanceStatus = catchAsyncErrors(async (_req: Request, res: Response) => {
  const { prisma } = await import('../lib/db');
  let maintenance = false;
  try {
    const row = await (prisma as any).platformSetting.findUnique({
      where: { key: 'maintenanceMode' },
    });
    maintenance = row?.value === true || row?.value === 'true';
  } catch {
    // Erreur de lecture → on considère que la maintenance est levée (éviter un blocage)
  }
  res.json({ success: true, maintenance });
});

export const testEmail = catchAsyncErrors(async (req: Request, res: Response) => {
  const { to, subject, text } = req.body;
  if (!to) throw new AppError('Email requis (to)', 400);
  const { sendEmail } = await import('../lib/mail');
  await sendEmail(to, subject || 'Test AfriBiz', text || 'Email de test depuis le serveur AfriBiz');
  res.json({ success: true, message: 'Email de test envoye avec succes' });
});
