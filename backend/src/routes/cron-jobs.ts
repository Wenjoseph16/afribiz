import { Router, Request, Response } from 'express';
import { CronService, JobStatus, ActivityLogEntry } from '../services/CronService';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authMiddleware);

router.get('/status', requireRole(['ADMIN', 'BUSINESS']), async (_req: Request, res: Response) => {
  try {
    const statuses: JobStatus[] = CronService.getStatuses();
    const activeCount = statuses.filter((j) => j.enabled).length;
    const totalEvents = statuses.reduce((s, j) => s + (j.todayCount || 0), 0);
    const totalErrors = statuses.reduce((s, j) => s + (j.errorCount || 0), 0);

    res.json(
      successResponse({
        jobs: statuses,
        summary: {
          total: statuses.length,
          active: activeCount,
          inactive: statuses.length - activeCount,
          totalEvents,
          totalErrors,
        },
      })
    );
  } catch {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation du statut des automatisations',
    });
  }
});

router.get(
  '/activity',
  requireRole(['ADMIN', 'BUSINESS']),
  async (_req: Request, res: Response) => {
    try {
      const logs: ActivityLogEntry[] = CronService.getActivityLog();
      res.json(successResponse(logs));
    } catch {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recuperation des logs',
      });
    }
  }
);

router.get(
  '/execution-logs',
  requireRole(['ADMIN', 'BUSINESS']),
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await CronService.getExecutionLogs(limit);
      res.json(successResponse(logs));
    } catch {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recuperation des logs d execution',
      });
    }
  }
);

router.get(
  '/failed-jobs',
  requireRole(['ADMIN', 'BUSINESS']),
  async (_req: Request, res: Response) => {
    try {
      const failed = await CronService.getFailedJobs();
      res.json(successResponse(failed));
    } catch {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recuperation des jobs en echec',
      });
    }
  }
);

router.get(
  '/error-rate',
  requireRole(['ADMIN', 'BUSINESS']),
  async (_req: Request, res: Response) => {
    try {
      const rate = await CronService.getErrorRate();
      res.json(successResponse(rate));
    } catch {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recuperation du taux d erreur',
      });
    }
  }
);

// Export CSV des logs d'exécution
router.get(
  '/export-csv',
  requireRole(['ADMIN', 'BUSINESS']),
  async (_req: Request, res: Response) => {
    try {
      const logs = await CronService.getExecutionLogs(1000);
      const header = 'Job,Statut,Durée (ms),Erreur,Date\n';
      const rows = (
        logs as Array<{
          jobName: string;
          status: string;
          duration: number;
          error?: string;
          timestamp: string;
        }>
      )
        .map((l) => {
          const escapedName = `"${l.jobName.replace(/"/g, '""')}"`;
          const escapedError = l.error ? `"${l.error.replace(/"/g, '""')}"` : '';
          return `${escapedName},${l.status},${l.duration},${escapedError},${l.timestamp}`;
        })
        .join('\n');
      const csv = '\uFEFF' + header + rows; // BOM UTF-8 pour Excel
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="cron-execution-logs.csv"');
      res.send(csv);
    } catch {
      res.status(500).json({
        success: false,
        error: "Erreur lors de l'export CSV",
      });
    }
  }
);

// Toggle a job on/off (stop/start réel)
router.patch(
  '/:id/toggle',
  requireRole(['ADMIN', 'BUSINESS']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const job = CronService.getStatuses().find((j) => j.id === id);
      if (!job) {
        res.status(404).json({ success: false, error: 'Job introuvable' });
        return;
      }
      const newEnabled = !job.enabled;
      await CronService.setJobEnabled(id, newEnabled);
      res.json(
        successResponse({ id, enabled: newEnabled }, `Job ${newEnabled ? 'activé' : 'désactivé'}`)
      );
    } catch {
      res.status(500).json({
        success: false,
        error: 'Erreur lors du basculement du job',
      });
    }
  }
);

export default router;
