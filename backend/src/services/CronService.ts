import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { NotificationType } from '@prisma/client';
import { getIO } from './socket';
import {
  publishBookingReminder,
  publishDebtOverdue,
  publishSubscriptionExpiring,
  publishClientInactive,
  publishCartAbandoned,
  publishCampaignScheduled,
  publishLowStock,
  publishOutOfStock,
  publishSetupIncomplete,
  publishRentalReturnReminder,
  publishDeliveryNoStart,
  publishDeliveryReassigned,
  publishDocumentExpiring,
  publishSatisfactionSurvey,
  publishClientBirthday,
  publishEscrowReleased,
  publishOrderPendingReminder,
  publishOrderAutoCancelled,
  publishTrialExpiring,
} from '../events/publishers';
import { expireOldStories, expireOldFeedItems } from './storyService';
import { expireCampaigns as expireAdCampaigns, autoActivateCampaigns } from './ads';
import * as fedapay from '../lib/fedapay';
import { generateAllMorningBriefs, generateAllEveningSummaries } from './growthEngineService';
import { checkAllBusinessesUrgency } from './attentionService';
import { detectAllOpportunities } from './opportunityService';
import { QueueService } from '../events/QueueService';
import { recomputeAllScores } from './afriScoreService';
import { generateAllCopilotNotifications } from './copilotNotificationService';
import { getAdminAlertQueue, getActiveAdminIds } from './adminService';
import { sendEmail } from '../lib/mail';

const CRON_STATUS_KEY = 'cron_job_statuses';
const CRON_LOG_KEY = 'cron_execution_logs';

export interface JobStatus {
  id: string;
  name: string;
  description: string;
  category:
    | 'client'
    | 'sales'
    | 'finance'
    | 'marketing'
    | 'inventory'
    | 'operations'
    | 'hr'
    | 'system';
  schedule: string;
  cron: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  todayCount: number;
  errorCount: number;
  lastError: string | null;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  target: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface ExecutionLog {
  jobId: string;
  jobName: string;
  status: 'success' | 'error';
  duration: number;
  error?: string;
  timestamp: string;
}

export class CronService {
  private static started = false;
  private static jobStatuses: Map<string, JobStatus> = new Map();
  private static scheduledTasks: Map<string, ScheduledTask> = new Map();
  private static activityLog: ActivityLogEntry[] = [];
  private static activityCounter = 0;
  private static isNotifyingAdmins = false;

  static getStatuses(): JobStatus[] {
    return Array.from(CronService.jobStatuses.values());
  }

  static getActivityLog(): ActivityLogEntry[] {
    return CronService.activityLog.slice(0, 100);
  }

  static async getExecutionLogs(limit = 100): Promise<ExecutionLog[]> {
    try {
      const setting = await (prisma as any).platformSetting.findUnique({
        where: { key: CRON_LOG_KEY },
      });
      if (!setting?.value) return [];
      const logs = setting.value as unknown as ExecutionLog[];
      return logs.slice(0, limit);
    } catch {
      return [];
    }
  }

  static async getFailedJobs(): Promise<ExecutionLog[]> {
    const logs = await CronService.getExecutionLogs(500);
    return logs.filter((l) => l.status === 'error').slice(0, 20);
  }

  static async getErrorRate(): Promise<{ total: number; errors: number; rate: number }> {
    const logs = await CronService.getExecutionLogs(500);
    const total = logs.length;
    const errors = logs.filter((l) => l.status === 'error').length;
    return { total, errors, rate: total > 0 ? Math.round((errors / total) * 100) : 0 };
  }

  static async setJobEnabled(jobId: string, enabled: boolean): Promise<void> {
    const job = CronService.jobStatuses.get(jobId);
    if (!job) throw new Error(`Job "${jobId}" not found`);

    job.enabled = enabled;
    CronService.jobStatuses.set(jobId, job);

    // Arrêt/Démarrage réel du scheduler
    if (enabled) {
      CronService.startJob(jobId);
    } else {
      CronService.stopJob(jobId);
    }

    // Persist in database
    try {
      const existing = await (prisma as any).platformSetting.findUnique({
        where: { key: CRON_STATUS_KEY },
      });
      const statuses: Record<string, boolean> = existing?.value
        ? (existing.value as unknown as Record<string, boolean>)
        : {};
      statuses[jobId] = enabled;
      await (prisma as any).platformSetting.upsert({
        where: { key: CRON_STATUS_KEY },
        create: {
          key: CRON_STATUS_KEY,
          value: JSON.parse(JSON.stringify(statuses)),
          category: 'system',
          label: 'Cron job enabled statuses',
        },
        update: { value: JSON.parse(JSON.stringify(statuses)) },
      });
    } catch (err) {
      logger.error(`CronService: failed to persist job status for ${jobId}`, { error: err });
    }

    CronService.addActivity(
      enabled ? 'Job activé' : 'Job désactivé',
      `${job.name} — ${enabled ? 'Activé' : 'Désactivé'}`,
      'info'
    );
  }

  private static startJob(jobId: string): void {
    const existing = CronService.scheduledTasks.get(jobId);
    if (existing) {
      existing.start();
      return;
    }
    // Si pas de tâche pré-enregistrée, on ne peut pas la créer ici
    // Les tâches sont créées dans start()
    logger.info(
      `CronService: startJob(${jobId}) — no pre-registered task (will be created on next restart)`
    );
  }

  private static stopJob(jobId: string): void {
    const task = CronService.scheduledTasks.get(jobId);
    if (task) {
      task.stop();
      logger.info(`CronService: stopped job ${jobId}`);
    }
  }

  private static async loadPersistedStates(): Promise<void> {
    try {
      const setting = await (prisma as any).platformSetting.findUnique({
        where: { key: CRON_STATUS_KEY },
      });
      if (!setting?.value) return;
      const statuses = setting.value as Record<string, boolean>;
      for (const [jobId, enabled] of Object.entries(statuses)) {
        const job = CronService.jobStatuses.get(jobId);
        if (job) {
          job.enabled = enabled;
          CronService.jobStatuses.set(jobId, job);
          if (!enabled) {
            CronService.stopJob(jobId);
          }
        }
      }
      logger.info(`CronService: loaded ${Object.keys(statuses).length} persisted job statuses`);
    } catch (err) {
      logger.error('CronService: failed to load persisted job statuses', { error: err });
    }
  }

  private static async persistExecutionLog(log: ExecutionLog): Promise<void> {
    try {
      const existing = await (prisma as any).platformSetting.findUnique({
        where: { key: CRON_LOG_KEY },
      });
      const logs: ExecutionLog[] = existing?.value
        ? (existing.value as unknown as ExecutionLog[])
        : [];
      logs.unshift(log);
      // Garder max 1000 entrées
      if (logs.length > 1000) logs.length = 1000;
      await (prisma as any).platformSetting.upsert({
        where: { key: CRON_LOG_KEY },
        create: {
          key: CRON_LOG_KEY,
          value: JSON.parse(JSON.stringify(logs)),
          category: 'system',
          label: 'Cron execution logs',
        },
        update: { value: JSON.parse(JSON.stringify(logs)) },
      });
    } catch (err) {
      logger.error('CronService: failed to persist execution log', { error: err });
    }
  }

  private static async notifyAdminError(jobName: string, error: string): Promise<void> {
    if (CronService.isNotifyingAdmins) return;
    CronService.isNotifyingAdmins = true;
    try {
      const adminIds = await getActiveAdminIds();
      for (const userId of adminIds) {
        await prisma.notification.create({
          data: {
            userId,
            type: NotificationType.SYSTEM,
            title: `🔴 Échec CRON: ${jobName}`,
            description: `Erreur: ${error.substring(0, 200)}`,
            metadata: { jobName, error, source: 'CronService' },
          },
        });
      }
    } catch (err) {
      logger.error('CronService: failed to notify admins', { error: err });
    } finally {
      CronService.isNotifyingAdmins = false;
    }
  }

  /**
   * Résumé quotidien admin — email + notification in-app des alertes à traiter
   * (KYC en attente, litiges ouverts, pubs à valider, payouts, tickets, fraude,
   * abonnements qui expirent). Réutilise la même logique que la file d'alertes
   * du dashboard admin (getAdminAlertQueue).
   */
  static async adminDailyDigest(): Promise<void> {
    try {
      const { alerts, total, urgent } = await getAdminAlertQueue();
      if (total === 0) return; // Rien à signaler, pas d'email

      // Résoudre les admins actifs (même logique que le guard — helper centralisé)
      const adminIds = await getActiveAdminIds();
      if (adminIds.length === 0) return;
      const admins = await prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
      if (admins.length === 0) return;

      const severityColor: Record<string, string> = {
        CRITICAL: '#dc2626',
        HIGH: '#d97706',
        MEDIUM: '#2563eb',
        LOW: '#6b7280',
      };
      const rows = alerts
        .map(
          (a) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px;font-size:14px;color:#0f172a;">${a.label}</td>
              <td style="padding:10px 12px;text-align:center;">
                <span style="display:inline-block;min-width:28px;padding:2px 10px;border-radius:999px;background:${severityColor[a.severity] || '#6b7280'}15;color:${severityColor[a.severity] || '#6b7280'};font-weight:600;font-size:13px;">${a.count}</span>
              </td>
              <td style="padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.03em;">${a.severity}</td>
            </tr>`
        )
        .join('');

      const dateLabel = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const subject = `AfriBiz — ${total} alerte${total > 1 ? 's' : ''} à traiter (${urgent} prioritaire${urgent > 1 ? 's' : ''})`;
      const html = `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;margin:0;padding:24px;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:#0f172a;padding:24px;color:#ffffff;">
              <h1 style="margin:0;font-size:20px;">📋 Résumé quotidien AfriBiz</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${dateLabel}</p>
            </div>
            <div style="padding:24px;">
              <p style="font-size:14px;color:#334155;margin:0 0 16px;">
                Bonjour${admins.length === 1 && admins[0].firstName ? ` ${admins[0].firstName}` : ''}, voici les points qui nécessitent votre attention aujourd'hui :
              </p>
              <table style="width:100%;border-collapse:collapse;background:#fff;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;">Alerte</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;">Nombre</th>
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;">Priorité</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
              <div style="margin-top:20px;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;font-size:13px;color:#92400e;">
                ⚠️ ${urgent} alerte${urgent > 1 ? 's' : ''} de priorité haute ou critique — traitez-les en priorité depuis le tableau de bord.
              </div>
              <p style="margin-top:20px;font-size:13px;color:#64748b;">
                Pour traiter ces alertes : <a href="https://afribiz.com/dashboard/admin" style="color:#2563eb;">ouvrir le dashboard admin</a>
              </p>
            </div>
          </div>
        </body></html>
      `;

      for (const admin of admins) {
        // Email
        try {
          await sendEmail(admin.email, subject, html);
        } catch (err) {
          logger.warn(`[cron] Échec envoi résumé admin à ${admin.email}`, {
            error: (err as Error).message,
          });
        }
        // Notification in-app (dédupliquée sur 24h)
        try {
          const existing = await prisma.notification.findFirst({
            where: {
              userId: admin.id,
              type: NotificationType.SYSTEM,
              metadata: { path: ['source'], equals: 'admin-daily-digest' },
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          });
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                type: NotificationType.SYSTEM,
                title: `📋 ${total} alerte${total > 1 ? 's' : ''} à traiter`,
                description: `${urgent} prioritaire${urgent > 1 ? 's' : ''} — KYC, litiges, pubs, payouts. Consultez le dashboard.`,
                metadata: { alerts, source: 'admin-daily-digest' },
              },
            });
          }
        } catch (err) {
          logger.warn(`[cron] Échec notification résumé admin ${admin.id}`, {
            error: (err as Error).message,
          });
        }
      }

      logger.info(
        `[cron] Résumé quotidien admin envoyé à ${admins.length} admin(s) — ${total} alertes`
      );
    } catch (err) {
      logger.error('CronService: adminDailyDigest failed', { error: (err as Error).message });
    }
  }

  private static addActivity(
    action: string,
    target: string,
    status: 'success' | 'warning' | 'error' | 'info'
  ) {
    CronService.activityCounter++;
    const entry: ActivityLogEntry = {
      id: String(CronService.activityCounter),
      action,
      target,
      time: new Date().toISOString(),
      status,
    };
    CronService.activityLog.unshift(entry);
    if (CronService.activityLog.length > 200) {
      CronService.activityLog.pop();
    }
  }

  private static registerJob(job: JobStatus) {
    CronService.jobStatuses.set(job.id, job);
  }

  private static scheduleWithTracking(
    jobId: string,
    expression: string,
    fn: () => Promise<void>,
    actionLabel: string
  ): void {
    const task = cron.schedule(expression, () => {
      CronService.trackRun(jobId, fn, actionLabel).catch(() => {});
    });
    CronService.scheduledTasks.set(jobId, task);
  }

  private static async trackRun(
    jobId: string,
    fn: () => Promise<void>,
    actionLabel: string
  ): Promise<void> {
    const startTime = Date.now();
    const now = new Date();
    try {
      await fn();
      const job = CronService.jobStatuses.get(jobId);
      if (job) {
        job.lastRun = now.toISOString();
        job.todayCount = (job.todayCount || 0) + 1;
        job.nextRun = null;
        CronService.jobStatuses.set(jobId, job);
      }
      CronService.addActivity(actionLabel, 'Exécution réussie', 'success');
      // Persist success log
      CronService.persistExecutionLog({
        jobId,
        jobName: job?.name || jobId,
        status: 'success',
        duration: Date.now() - startTime,
        timestamp: now.toISOString(),
      }).catch(() => {});
    } catch (err) {
      const errMsg = (err as Error).message;
      const job = CronService.jobStatuses.get(jobId);
      if (job) {
        job.lastRun = now.toISOString();
        job.todayCount = (job.todayCount || 0) + 1;
        job.errorCount = (job.errorCount || 0) + 1;
        job.lastError = errMsg.substring(0, 200);
        job.nextRun = null;
        CronService.jobStatuses.set(jobId, job);
      }
      CronService.addActivity(actionLabel, `Erreur: ${errMsg}`, 'error');
      logger.error(`Cron: ${jobId} failed`, { error: errMsg });

      // Persist error log
      CronService.persistExecutionLog({
        jobId,
        jobName: job?.name || jobId,
        status: 'error',
        duration: Date.now() - startTime,
        error: errMsg,
        timestamp: now.toISOString(),
      }).catch(() => {});

      // Notifier les admins (au max 1 notification simultanée)
      CronService.notifyAdminError(job?.name || jobId, errMsg).catch(() => {});

      // Émettre un événement WebSocket pour les alertes en temps réel
      try {
        const io = getIO();
        if (io) {
          io.to('admin:alerts').emit('cron:job-error', {
            jobId,
            jobName: job?.name || jobId,
            error: errMsg.substring(0, 300),
            timestamp: now.toISOString(),
            todayCount: job?.todayCount || 0,
            errorCount: job?.errorCount || 1,
          });
        }
      } catch {
        // Socket emission non bloquante
      }
    }
  }

  static start(): void {
    if (CronService.started) return;
    CronService.started = true;

    logger.info('CronService: starting scheduled jobs');

    // ── Register all jobs ──
    const JOBS: JobStatus[] = [
      {
        id: 'booking-reminders',
        name: 'Rappels de réservation',
        description: 'Envoie un rappel aux clients 24h avant leur réservation',
        category: 'client',
        schedule: 'Toutes les 15 min',
        cron: '*/15 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'admin-daily-digest',
        name: 'Résumé quotidien admin',
        description:
          'Email + notification récapitulatifs des alertes à traiter (KYC, litiges, pubs, payouts, fraude)',
        category: 'system',
        schedule: 'Chaque jour à 07:00',
        cron: '0 7 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'layaway-expiry-reminders',
        name: 'Rappels échéance Épargne Achat',
        description:
          'Rappels BIENVEILLANTS (J-7 puis J-1) aux clients qui épargnent, sans pénalité ni stress',
        category: 'client',
        schedule: 'Chaque jour à 09:00',
        cron: '0 9 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'overdue-debts',
        name: 'Dettes impayées',
        description: 'Détecte et notifie les dettes arrivées à échéance',
        category: 'finance',
        schedule: 'Chaque jour à 06:00',
        cron: '0 6 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'campaign-dispatch',
        name: 'Envoi campagnes',
        description: 'Déclenche les campagnes marketing programmées',
        category: 'marketing',
        schedule: 'Chaque minute',
        cron: '* * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'pending-orders',
        name: 'Commandes en attente',
        description: 'Relance les commandes non traitées et annule après 60 min',
        category: 'sales',
        schedule: 'Toutes les 5 min',
        cron: '*/5 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'abandoned-carts',
        name: 'Paniers abandonnés',
        description: 'Relance les clients avec un panier non finalisé depuis +2h',
        category: 'sales',
        schedule: 'Toutes les 30 min',
        cron: '*/30 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'inactive-clients',
        name: 'Clients inactifs',
        description: 'Identifie les clients sans commande depuis 90 jours',
        category: 'client',
        schedule: 'Chaque jour à 07:00',
        cron: '0 7 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'copilot-alerts',
        name: 'Alertes Copilot',
        description: 'Génère des notifications intelligentes pour les business',
        category: 'system',
        schedule: 'Chaque jour à 07:30',
        cron: '30 7 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'expiring-subscriptions',
        name: 'Abonnements expirants',
        description: "Notifie les clients dont l'abonnement expire dans 7 jours",
        category: 'finance',
        schedule: 'Chaque jour à 08:00',
        cron: '0 8 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'expiring-trials',
        name: 'Essais expirants',
        description: 'Notifie et expire les essais de modules arrivés à terme',
        category: 'sales',
        schedule: 'Chaque jour à 09:00',
        cron: '0 9 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'overdue-rentals',
        name: 'Locations en retard',
        description: 'Détecte les locations non retournées à temps',
        category: 'operations',
        schedule: 'Chaque jour à 06:30',
        cron: '30 6 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'low-stock',
        name: 'Stock faible',
        description: 'Alerte quand un produit atteint ≤5 unités en stock',
        category: 'inventory',
        schedule: 'Chaque jour à 09:00',
        cron: '0 9 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'setup-incomplete',
        name: 'Configuration incomplète',
        description: 'Relance les business sans description, logo ou horaires',
        category: 'system',
        schedule: 'Chaque jour à 10:00',
        cron: '0 10 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'birthdays',
        name: 'Souhaits anniversaire',
        description: 'Envoie automatiquement des vœux aux clients le jour J',
        category: 'client',
        schedule: 'Chaque jour à 08:00',
        cron: '0 8 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'rental-returns',
        name: 'Retour locations',
        description: 'Rappelle les clients 24h avant la fin de leur location',
        category: 'operations',
        schedule: 'Chaque jour à 07:00',
        cron: '0 7 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'delivery-starts',
        name: 'Démarrage livraisons',
        description: 'Détecte et réassigne les livraisons non démarrées après 30 min',
        category: 'operations',
        schedule: 'Toutes les 15 min',
        cron: '*/15 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'expiring-documents',
        name: 'Documents expirants',
        description: 'Notifie les employés dont les documents expirent dans 30 jours',
        category: 'hr',
        schedule: 'Chaque jour à 06:00',
        cron: '0 6 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'satisfaction-surveys',
        name: 'Enquêtes satisfaction',
        description: 'Envoie un questionnaire après commande ou séjour terminé',
        category: 'client',
        schedule: 'Chaque jour à 07:00',
        cron: '0 7 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'escrow-release',
        name: 'Libération séquestre',
        description: 'Libère automatiquement les fonds séquestre 48h après livraison',
        category: 'finance',
        schedule: 'Chaque jour à 10:00',
        cron: '0 10 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'auto-escrow-release',
        name: 'Séquestre auto (14j)',
        description: 'Libère les fonds sans commande associée après 14 jours',
        category: 'finance',
        schedule: 'Chaque jour à 10:30',
        cron: '30 10 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'expire-stories',
        name: 'Expiration stories',
        description: 'Expire les stories et publications dépassées',
        category: 'system',
        schedule: 'Toutes les 15 min',
        cron: '*/15 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'score-recalculation',
        name: 'Recalcul AfriScore',
        description: 'Met à jour les scores de réputation quotidiens',
        category: 'system',
        schedule: 'Chaque jour à 00:00',
        cron: '0 0 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'cleanup',
        name: 'Nettoyage système',
        description: 'Supprime les événements traités, sessions et tokens expirés',
        category: 'system',
        schedule: 'Chaque dimanche à 03:00',
        cron: '0 3 * * 0',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'inactive-accounts',
        name: 'Comptes inactifs',
        description: 'Désactive les comptes inactifs depuis 90+ jours',
        category: 'system',
        schedule: 'Chaque jour à 05:00',
        cron: '0 5 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'expire-ads-campaigns',
        name: 'Expiration campagnes pub',
        description: 'Marque les campagnes publicitaires terminées comme COMPLETED',
        category: 'marketing',
        schedule: 'Toutes les 15 min',
        cron: '*/15 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'auto-activate-campaigns',
        name: 'Activation campagnes pub',
        description: 'Active automatiquement les campagnes publicitaires programmées',
        category: 'marketing',
        schedule: 'Toutes les 15 min',
        cron: '*/15 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'expire-offers',
        name: 'Expiration offres flash',
        description: 'Expire automatiquement les offres flash dépassées',
        category: 'marketing',
        schedule: 'Toutes les 15 min',
        cron: '*/15 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'morning-briefs',
        name: 'Briefs matinaux',
        description: 'Génère le résumé quotidien pour chaque business',
        category: 'system',
        schedule: 'Chaque jour à 06:00',
        cron: '0 6 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'evening-summaries',
        name: 'Résumés soir',
        description: 'Génère le bilan de fin de journée pour chaque business',
        category: 'system',
        schedule: 'Chaque jour à 20:00',
        cron: '0 20 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'urgency-alerts',
        name: 'Alertes urgence',
        description: 'Détecte les situations critiques nécessitant une attention immédiate',
        category: 'system',
        schedule: 'Toutes les 30 min',
        cron: '*/30 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'opportunity-detection',
        name: 'Détection opportunités',
        description: 'Identifie les opportunités de croissance pour les business',
        category: 'marketing',
        schedule: 'Chaque jour à 04:00',
        cron: '0 4 * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'auto-unfreeze',
        name: 'Auto-dégel des comptes',
        description:
          'Réactive automatiquement les comptes (users + business) dont le gel temporaire est expiré',
        category: 'system',
        schedule: 'Toutes les 15 min',
        cron: '*/15 * * * *',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
      {
        id: 'loyalty-points',
        name: 'Points fidélité',
        description: 'Crédite automatiquement les points sur chaque commande/paiement',
        category: 'marketing',
        schedule: 'Temps réel (events)',
        cron: 'event-driven',
        enabled: true,
        lastRun: null,
        nextRun: null,
        todayCount: 0,
        errorCount: 0,
        lastError: null,
      },
    ];

    for (const job of JOBS) {
      CronService.registerJob(job);
    }

    // ── Schedule all jobs with tracking (seulement si enabled) ──
    const scheduleIfEnabled = (
      jobId: string,
      expression: string,
      fn: () => Promise<void>,
      label: string
    ) => {
      const job = CronService.jobStatuses.get(jobId);
      if (!job || !job.enabled) {
        // On enregistre quand même pour pouvoir l'activer plus tard
        if (expression !== 'event-driven') {
          const task = cron.schedule(expression, () => {
            // Ne rien faire si désactivé
            const j = CronService.jobStatuses.get(jobId);
            if (!j?.enabled) return;
            CronService.trackRun(jobId, fn, label).catch(() => {});
          });
          CronService.scheduledTasks.set(jobId, task);
          if (job) task.stop(); // Arrêtée immédiatement car disabled
        }
        return;
      }
      CronService.scheduleWithTracking(jobId, expression, fn, label);
    };

    scheduleIfEnabled(
      'booking-reminders',
      '*/15 * * * *',
      () => CronService.checkBookingReminders(),
      'Rappel réservation envoyé'
    );
    scheduleIfEnabled(
      'admin-daily-digest',
      '0 7 * * *',
      () => CronService.adminDailyDigest(),
      'Résumé quotidien admin envoyé'
    );
    scheduleIfEnabled(
      'layaway-expiry-reminders',
      '0 9 * * *',
      () => CronService.checkLayawayExpiryReminders(),
      'Rappels échéance épargne envoyés'
    );
    scheduleIfEnabled(
      'overdue-debts',
      '0 6 * * *',
      () => CronService.checkOverdueDebts(),
      'Dettes impayées vérifiées'
    );
    scheduleIfEnabled(
      'campaign-dispatch',
      '* * * * *',
      () => CronService.dispatchCampaigns(),
      'Campagne déclenchée'
    );
    scheduleIfEnabled(
      'pending-orders',
      '*/5 * * * *',
      () => CronService.checkPendingOrders(),
      'Commandes en attente vérifiées'
    );
    scheduleIfEnabled(
      'abandoned-carts',
      '*/30 * * * *',
      () => CronService.checkAbandonedCarts(),
      'Paniers abandonnés détectés'
    );
    scheduleIfEnabled(
      'inactive-clients',
      '0 7 * * *',
      () => CronService.checkInactiveClients(),
      'Clients inactifs identifiés'
    );
    scheduleIfEnabled(
      'copilot-alerts',
      '30 7 * * *',
      () => CronService.checkCopilotAlerts(),
      'Alertes Copilot générées'
    );
    scheduleIfEnabled(
      'expiring-subscriptions',
      '0 8 * * *',
      () => CronService.checkExpiringSubscriptions(),
      'Abonnements expirants notifiés'
    );
    scheduleIfEnabled(
      'expiring-trials',
      '0 9 * * *',
      () => CronService.checkExpiringTrials(),
      'Essais expirants traités'
    );
    scheduleIfEnabled(
      'module-subscriptions',
      '30 3 * * *',
      () => CronService.processModuleSubscriptions(),
      'Abonnements modules traités'
    );
    scheduleIfEnabled(
      'overdue-rentals',
      '30 6 * * *',
      () => CronService.checkOverdueRentals(),
      'Locations en retard vérifiées'
    );
    scheduleIfEnabled(
      'low-stock',
      '0 9 * * *',
      () => CronService.checkLowStock(),
      'Stock faible détecté'
    );
    scheduleIfEnabled(
      'setup-incomplete',
      '0 10 * * *',
      () => CronService.checkSetupIncomplete(),
      'Configuration incomplète détectée'
    );
    scheduleIfEnabled(
      'birthdays',
      '0 8 * * *',
      () => CronService.checkBirthdays(),
      'Anniversaires vérifiés'
    );
    scheduleIfEnabled(
      'rental-returns',
      '0 7 * * *',
      () => CronService.checkRentalReturns(),
      'Retours locations rappelés'
    );
    scheduleIfEnabled(
      'delivery-starts',
      '*/15 * * * *',
      () => CronService.checkDeliveryStarts(),
      'Livraisons démarrées vérifiées'
    );
    scheduleIfEnabled(
      'expiring-documents',
      '0 6 * * *',
      () => CronService.checkExpiringDocuments(),
      'Documents expirants notifiés'
    );
    scheduleIfEnabled(
      'satisfaction-surveys',
      '0 7 * * *',
      () => CronService.sendSatisfactionSurveys(),
      'Enquêtes satisfaction envoyées'
    );
    scheduleIfEnabled(
      'escrow-release',
      '0 10 * * *',
      () => CronService.checkEscrowRelease(),
      'Séquestre libéré automatiquement'
    );
    scheduleIfEnabled(
      'auto-escrow-release',
      '30 10 * * *',
      () => CronService.checkAutoEscrowRelease(),
      'Séquestre auto libéré (14j)'
    );
    scheduleIfEnabled(
      'expire-stories',
      '*/15 * * * *',
      () => CronService.expireStories(),
      'Stories expirées'
    );
    scheduleIfEnabled(
      'score-recalculation',
      '0 0 * * *',
      () => CronService.recalculateScores(),
      'Scores recalculés'
    );
    scheduleIfEnabled(
      'cleanup',
      '0 3 * * 0',
      () => CronService.cleanup(),
      'Nettoyage système effectué'
    );
    scheduleIfEnabled(
      'inactive-accounts',
      '0 5 * * *',
      () => CronService.checkInactiveAccounts(),
      'Comptes inactifs nettoyés'
    );

    // ── Ad Campaigns ──
    scheduleIfEnabled(
      'expire-ads-campaigns',
      '*/15 * * * *',
      () =>
        expireAdCampaigns().then((count) => {
          if (count > 0) logger.info(`Cron: expired ${count} ad campaigns`);
        }),
      'Campagnes pub expirées'
    );
    scheduleIfEnabled(
      'auto-activate-campaigns',
      '*/15 * * * *',
      () =>
        autoActivateCampaigns().then((count) => {
          if (count > 0) logger.info(`Cron: auto-activated ${count} ad campaigns`);
        }),
      'Campagnes pub activées'
    );

    // ── Offres Flash ──
    scheduleIfEnabled(
      'expire-offers',
      '*/15 * * * *',
      () => CronService.expireOffers(),
      'Offres flash expirées'
    );

    // ── Growth Engine ──
    scheduleIfEnabled(
      'morning-briefs',
      '0 6 * * *',
      () => CronService.generateMorningBriefs(),
      'Brief matinal généré'
    );
    scheduleIfEnabled(
      'evening-summaries',
      '0 20 * * *',
      () => CronService.generateEveningSummaries(),
      'Résumé soir généré'
    );
    scheduleIfEnabled(
      'urgency-alerts',
      '*/30 * * * *',
      () => CronService.checkUrgencyAlerts(),
      'Alertes urgence vérifiées'
    );
    scheduleIfEnabled(
      'opportunity-detection',
      '0 4 * * *',
      () => CronService.detectOpportunities(),
      'Opportunités détectées'
    );
    scheduleIfEnabled(
      'auto-unfreeze',
      '*/15 * * * *',
      () => CronService.autoUnfreeze(),
      'Comptes gelés réactivés'
    );

    // Rétablir les états persistés (arrêter les jobs disabled)
    CronService.loadPersistedStates().catch((err) => {
      logger.error('CronService: failed to load persisted states', { error: err });
    });

    const enabledCount = Array.from(CronService.jobStatuses.values()).filter(
      (j) => j.enabled
    ).length;
    logger.info(`CronService: ${JOBS.length} jobs registered, ${enabledCount} enabled`);
  }

  // ─── All existing job methods below (unchanged) ───

  public static async checkBookingReminders(): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        startDate: { gte: now, lte: in24h },
        reminderSent: false,
        businessId: { not: null },
      },
    });
    for (const b of bookings) {
      if (!b.businessId) continue;
      const biz = await prisma.business.findUnique({
        where: { id: b.businessId },
        select: { ownerId: true, name: true },
      });
      if (!biz) continue;
      publishBookingReminder({
        userId: biz.ownerId,
        bookingId: b.id,
        businessName: biz.name || '',
      });
      await prisma.booking.update({
        where: { id: b.id },
        data: { reminderSent: true, remindedAt: now },
      });
    }
    if (bookings.length > 0) logger.info(`Cron: sent ${bookings.length} booking reminders`);
  }

  /**
   * Rappel d'échéance BIENVEILLANT pour les plans Épargne Achat.
   * Zéro pénalité, zéro stress : on encourage doucement à compléter.
   * - J-7 : rappel doux « il vous reste 7 jours »
   * - J-1 : dernier rappel bienveillant
   * Chaque plan n'est notifié qu'une fois par étape (reminderSentAt conservé).
   */
  public static async checkLayawayExpiryReminders(): Promise<void> {
    const now = new Date();

    const plans = await prisma.layawayPlan.findMany({
      where: { status: 'ACTIVE', expiresAt: { not: null } },
      take: 200,
    });

    let sent = 0;
    for (const p of plans) {
      if (!p.expiresAt) continue;
      const daysLeft = Math.ceil((p.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const saved = Number(p.savedAmount);
      const target = Number(p.targetAmount);
      const progress = target > 0 ? Math.round((saved / target) * 100) : 0;

      // Rappel J-7 : fenêtre large 6-8 jours (7.1j -> ceil 8, on veut quand même notifier).
      // Le flag reminder7dSent garantit un envoi UNIQUE quelle que soit la fenêtre.
      const is7dWindow = daysLeft >= 6 && daysLeft <= 8 && !p.reminder7dSent;
      // Rappel J-3 : fenêtre 3-4 jours, envoi unique via reminder3dSent (bienveillant, sans pénalité)
      const is3dWindow = daysLeft >= 3 && daysLeft <= 4 && !p.reminder3dSent;
      // Rappel J-1 : derniers 2 jours, envoi unique via reminder1dSent
      const is24hWindow = daysLeft <= 2 && daysLeft > 0 && !p.reminder1dSent;

      if (!is7dWindow && !is3dWindow && !is24hWindow) continue;

      const stage = is7dWindow ? '7d' : is3dWindow ? '3d' : '1d';
      const data: any = {
        reminder7dSent: p.reminder7dSent,
        reminder3dSent: p.reminder3dSent,
        reminder1dSent: p.reminder1dSent,
        [stage === '7d' ? 'reminder7dSent' : stage === '3d' ? 'reminder3dSent' : 'reminder1dSent']: true,
        [stage === '7d' ? 'reminder7dAt' : stage === '3d' ? 'reminder3dAt' : 'reminder1dAt']: now,
      };

      const title =
        stage === '7d'
          ? '💛 Plus que 7 jours pour votre épargne'
          : stage === '3d'
            ? '⏳ Plus que 3 jours — votre épargne vous attend'
            : '🌱 Derniers jours pour compléter (sans pression)';
      const deadline =
        stage === '7d' ? 'encore 7 jours' : stage === '3d' ? 'encore 3 jours' : 'plus que quelques jours';

      try {
        await prisma.notification.create({
          data: {
            userId: p.clientId,
            type: 'PAYMENT_REMINDER' as any,
            title,
            description:
              `${p.itemName} — vous êtes à ${progress}% (${saved.toLocaleString('fr-FR')} / ${target.toLocaleString('fr-FR')} FCFA), il vous reste ${deadline}. ` +
              `Aucune pression : cotisez quand vous voulez, ou annulez et soyez remboursé intégralement.`,
            link: '/dashboard/my-layaway',
            metadata: p.businessId ? { businessId: p.businessId, source: 'layaway-reminder' } : { source: 'layaway-reminder' },
          },
        });
        // Push temps réel (socket) — le client voit le rappel sans recharger
        try {
          getIO()
            ?.to(`user:${p.clientId}`)
            .emit('layaway:reminder', {
              planId: p.id,
              itemName: p.itemName,
              stage,
              progress,
              saved,
              target,
            });
        } catch {
          /* socket non prêt : non bloquant */
        }
        await prisma.layawayPlan.update({ where: { id: p.id }, data } as any);
        sent++;
      } catch (err) {
        logger.warn('Cron: layaway reminder failed', { error: (err as Error).message, planId: p.id });
      }
    }
    if (sent > 0) logger.info(`Cron: sent ${sent} gentle layaway reminders`);
  }

  public static async checkPendingOrders(): Promise<void> {
    const now = Date.now();
    const firstReminderStart = 15 * 60 * 1000;
    const firstReminderEnd = 20 * 60 * 1000;
    const urgentReminderStart = 30 * 60 * 1000;
    const urgentReminderEnd = 35 * 60 * 1000;
    const autoCancel = 60 * 60 * 1000;

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        buyerId: { not: null },
        businessId: { not: null },
        createdAt: { gte: new Date(now - 65 * 60 * 1000) },
      },
      include: {
        business: { select: { ownerId: true, name: true } },
        buyer: { select: { id: true, firstName: true } },
      },
    });

    for (const order of pendingOrders) {
      if (!order.businessId || !order.business || !order.buyerId) continue;
      const elapsed = now - new Date(order.createdAt).getTime();

      if (elapsed >= autoCancel) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: 'Annulation automatique - delai de reponse depasse',
          },
        });
        publishOrderAutoCancelled({
          userId: order.buyerId,
          orderId: order.id,
          businessName: order.business.name,
          businessId: order.businessId,
        });
        publishOrderAutoCancelled({
          userId: order.business.ownerId,
          orderId: order.id,
          businessName: order.business.name,
          businessId: order.businessId,
        });
        logger.info('Cron: auto-cancelled order ' + order.orderNumber + ' after 60 min');
      } else if (elapsed >= urgentReminderStart && elapsed < urgentReminderEnd) {
        publishOrderPendingReminder({
          userId: order.business.ownerId,
          orderId: order.id,
          businessName: order.business.name,
          amount: order.totalAmount.toString(),
          businessId: order.businessId,
          minutesElapsed: Math.floor(elapsed / 60000),
          reminderLevel: 'urgent',
        });
        await prisma.order.update({ where: { id: order.id }, data: { updatedAt: new Date() } });
        logger.info('Cron: sent urgent reminder for order ' + order.orderNumber);
      } else if (elapsed >= firstReminderStart && elapsed < firstReminderEnd) {
        publishOrderPendingReminder({
          userId: order.business.ownerId,
          orderId: order.id,
          businessName: order.business.name,
          amount: order.totalAmount.toString(),
          businessId: order.businessId,
          minutesElapsed: Math.floor(elapsed / 60000),
          reminderLevel: 'first',
        });
        await prisma.order.update({ where: { id: order.id }, data: { updatedAt: new Date() } });
        logger.info('Cron: sent first reminder for order ' + order.orderNumber);
      }
    }
    if (pendingOrders.length > 0)
      logger.info('Cron: checked ' + pendingOrders.length + ' pending orders');
  }

  public static async checkOverdueDebts(): Promise<void> {
    const overdue = await prisma.debt.findMany({
      where: { status: 'ACTIVE', dueDate: { lt: new Date() }, remainingAmount: { gt: 0 } },
    });
    for (const d of overdue) {
      const biz = await prisma.business.findUnique({
        where: { id: d.businessId },
        select: { ownerId: true, name: true },
      });
      if (!biz) continue;
      publishDebtOverdue({
        userId: biz.ownerId,
        debtId: d.id,
        businessId: d.businessId,
        amount: d.totalAmount.toString(),
      });
    }
    if (overdue.length > 0) logger.info(`Cron: flagged ${overdue.length} overdue debts`);
  }

  /**
   * Auto-unfreeze : réactive les comptes (users + business) dont le gel temporaire
   * est arrivé à expiration. Notification de réactivation envoyée.
   */
  public static async autoUnfreeze(): Promise<void> {
    const now = new Date();
    const [users, businesses] = await Promise.all([
      prisma.user.updateMany({
        where: { frozenUntil: { not: null, lte: now } },
        data: { frozenUntil: null, freezeReason: null },
      }),
      prisma.business.updateMany({
        where: { frozenUntil: { not: null, lte: now } },
        data: { isActive: true, frozenUntil: null, freezeReason: null },
      }),
    ]);
    const total = users.count + businesses.count;
    if (total > 0)
      logger.info(
        `Cron: auto-unfreeze ${total} comptes (${users.count} users, ${businesses.count} business)`
      );
  }

  public static async dispatchCampaigns(): Promise<void> {
    const now = new Date();
    const campaigns = await prisma.marketingCampaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
    });
    for (const c of campaigns) {
      const biz = await prisma.business.findUnique({
        where: { id: c.businessId },
        select: { ownerId: true, name: true },
      });
      if (!biz) continue;
      publishCampaignScheduled({ userId: biz.ownerId, businessId: c.businessId, campaignId: c.id });
      await prisma.marketingCampaign.update({
        where: { id: c.id },
        data: { status: 'COMPLETED', sentAt: now },
      });
    }
    if (campaigns.length > 0) logger.info(`Cron: dispatched ${campaigns.length} campaigns`);
  }

  public static async checkAbandonedCarts(): Promise<void> {
    const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: threshold },
        buyerId: { not: null },
        businessId: { not: null },
      },
    });
    for (const o of orders) {
      if (!o.buyerId || !o.businessId) continue;
      const biz = await prisma.business.findUnique({
        where: { id: o.businessId },
        select: { ownerId: true },
      });
      if (!biz) continue;
      publishCartAbandoned({
        userId: o.buyerId,
        businessId: o.businessId,
        orderId: o.id,
        amount: o.totalAmount.toString(),
      });
    }
    if (orders.length > 0) logger.info(`Cron: detected ${orders.length} abandoned carts`);
  }

  public static async checkInactiveClients(): Promise<void> {
    const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: { createdAt: { lt: threshold }, buyerId: { not: null }, businessId: { not: null } },
      select: { buyerId: true, businessId: true },
      distinct: ['buyerId', 'businessId'],
    });
    for (const o of orders) {
      if (!o.buyerId || !o.businessId) continue;
      const biz = await prisma.business.findUnique({
        where: { id: o.businessId },
        select: { ownerId: true },
      });
      if (!biz) continue;
      publishClientInactive({ userId: biz.ownerId, businessId: o.businessId, daysInactive: 90 });
    }
  }

  public static async checkExpiringTrials(): Promise<void> {
    const now = new Date();
    const installations = await prisma.developerModuleInstallation.findMany({
      where: { status: 'TRIAL', settings: { path: ['isTrial'], equals: true } },
      include: {
        module: { select: { name: true, developerId: true } },
        business: { select: { ownerId: true, name: true } },
      },
    });
    for (const inst of installations) {
      const settings = inst.settings as {
        isTrial?: boolean;
        trialEndsAt?: string;
        lastTrialNotified?: string;
      } | null;
      if (!settings?.trialEndsAt) continue;
      const trialEndsAt = new Date(settings.trialEndsAt);
      const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft === 2 || daysLeft === 1 || daysLeft === 0) {
        const lastNotified = settings.lastTrialNotified
          ? new Date(settings.lastTrialNotified)
          : null;
        if (lastNotified && lastNotified.toDateString() === now.toDateString()) continue;
        publishTrialExpiring({
          userId: inst.business.ownerId,
          businessId: inst.businessId,
          moduleId: inst.moduleId,
          moduleName: inst.module.name,
          daysLeft: Math.max(0, daysLeft),
        });
        await prisma.developerModuleInstallation.update({
          where: { id: inst.id },
          data: { settings: { ...settings, lastTrialNotified: now.toISOString() } },
        });
      }
      if (daysLeft < 0) {
        await prisma.developerModuleInstallation.update({
          where: { id: inst.id },
          data: { status: 'EXPIRED', settings: { ...settings, expiredAt: now.toISOString() } },
        });
        logger.info(
          `Cron: expired trial for module ${inst.module.name} (business: ${inst.business.name})`
        );
      }
    }
  }

  public static async checkExpiringSubscriptions(): Promise<void> {
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const subs = await prisma.businessSubscription.findMany({
      where: { status: 'ACTIVE', endDate: { lte: in7Days, gte: new Date() } },
    });
    for (const s of subs) {
      if (!s.endDate) continue;
      const biz = await prisma.business.findUnique({
        where: { id: s.businessId },
        select: { ownerId: true },
      });
      if (!biz) continue;
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: s.planId },
        select: { name: true },
      });
      const daysUntil = Math.ceil((s.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      publishSubscriptionExpiring({
        userId: biz.ownerId,
        subscriptionId: s.id,
        planName: plan?.name || 'Abonnement',
        daysUntilExpiry: daysUntil,
      });
    }
  }

  /**
   * Process module subscriptions (auto-renew or expire)
   * Uses FedaPay Plan + Subscription for recurring billing when configured.
   */
  public static async processModuleSubscriptions(): Promise<void> {
    const now = new Date();

    // Auto-renew subscriptions that are due and have autoRenew enabled
    const dueForRenewal = await (prisma as any).developerModuleSubscription.findMany({
      where: {
        status: 'ACTIVE',
        autoRenew: true,
        nextBillingAt: { lte: now, not: null },
      },
    });

    for (const sub of dueForRenewal) {
      try {
        const periodEnd = new Date();
        switch (sub.period) {
          case 'MONTHLY':
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            break;
          case 'QUARTERLY':
            periodEnd.setMonth(periodEnd.getMonth() + 3);
            break;
          case 'SEMESTRIAL':
            periodEnd.setMonth(periodEnd.getMonth() + 6);
            break;
          case 'YEARLY':
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            break;
        }

        // Attempt real FedaPay recurring charge (non-blocking)
        if (fedapay.isFedaPayAvailable()) {
          try {
            const business = await prisma.business.findUnique({
              where: { id: sub.businessId },
              select: { ownerId: true, name: true },
            });
            if (business) {
              const owner = await prisma.user.findUnique({
                where: { id: business.ownerId },
                select: { phone: true },
              });
              if (owner?.phone) {
                // Create a FedaPay transaction to charge for renewal
                await fedapay.createTransaction({
                  amount: Number(sub.amount),
                  mode: 'mtn_open',
                  description: `Renouvellement abonnement ${sub.period?.toLowerCase() || 'module'}`,
                  customerPhone: owner.phone,
                  customerName: business.name,
                });
                logger.info(
                  `Sub ${sub.id}: FedaPay renewal charge initiated for ${Number(sub.amount)}`
                );
              }
            }
          } catch (fpErr: any) {
            logger.warn(`Sub ${sub.id}: FedaPay charge failed (revenue still recorded)`, {
              error: fpErr.message,
            });
          }
        }

        // Record renewal revenue
        const module = await prisma.developerModule.findUnique({
          where: { id: sub.moduleId },
          select: { developerId: true, totalRevenue: true },
        });
        if (module) {
          const { getMonetizationSettings } = await import('./monetizationConfig');
          const settings = await getMonetizationSettings();
          const commissionAmount = Number(sub.amount) * settings.developerModuleCommissionRate;
          const netAmount = Number(sub.amount) - commissionAmount;

          await prisma.developerRevenue.create({
            data: {
              developerId: module.developerId,
              moduleId: sub.moduleId,
              type: 'MODULE_SALE' as any,
              amount: sub.amount,
              commissionAmount,
              netAmount,
              commissionRate: settings.developerModuleCommissionRate,
              status: 'COMPLETED',
            },
          });

          await prisma.developerModule.update({
            where: { id: sub.moduleId },
            data: { totalRevenue: { increment: netAmount } },
          });
        }

        // Extend subscription
        await (prisma as any).developerModuleSubscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodEnd: periodEnd,
            nextBillingAt: periodEnd,
          },
        });

        // Notify the business owner
        const business = await prisma.business.findUnique({
          where: { id: sub.businessId },
          select: { ownerId: true, name: true },
        });
        if (business?.ownerId) {
          await prisma.notification.create({
            data: {
              userId: business.ownerId,
              type: 'SYSTEM' as any,
              title: 'Abonnement module renouvelé',
              description: `Votre abonnement a été automatiquement renouvelé (${Number(sub.amount).toLocaleString()} ${sub.currency}).`,
              link: '/dashboard/business/modules',
              metadata: { subscriptionId: sub.id, moduleId: sub.moduleId },
            },
          });
        }
      } catch {
        // Non-blocking per subscription
      }
    }

    // Expire subscriptions that are past due without autoRenew
    const expired = await (prisma as any).developerModuleSubscription.findMany({
      where: {
        status: 'ACTIVE',
        autoRenew: false,
        currentPeriodEnd: { lte: now },
      },
    });

    for (const sub of expired) {
      try {
        await (prisma as any).developerModuleSubscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        });

        // Deactivate module configuration
        await prisma.moduleConfiguration.updateMany({
          where: { moduleId: sub.moduleId, businessId: sub.businessId },
          data: { isActive: false },
        });

        // Deactivate installation
        await prisma.developerModuleInstallation.updateMany({
          where: { moduleId: sub.moduleId, businessId: sub.businessId },
          data: { status: 'EXPIRED' },
        });

        // Notify business
        const business = await prisma.business.findUnique({
          where: { id: sub.businessId },
          select: { ownerId: true, name: true },
        });
        if (business?.ownerId) {
          await prisma.notification.create({
            data: {
              userId: business.ownerId,
              type: 'SYSTEM' as any,
              title: 'Abonnement module expiré',
              description: `Votre abonnement a expiré. Le module a été désactivé.`,
              link: '/dashboard/business/modules',
              metadata: { subscriptionId: sub.id, moduleId: sub.moduleId },
            },
          });
        }
      } catch {
        // Non-blocking
      }
    }
  }

  public static async checkOverdueRentals(): Promise<void> {
    const rentals = await prisma.rental.findMany({ where: { isActive: true } });
    if (rentals.length > 0) logger.debug(`Cron: found ${rentals.length} active rentals`);
  }

  public static async checkLowStock(): Promise<void> {
    const products = await prisma.product.findMany({
      where: { stock: { lte: 5 }, isActive: true, businessId: { not: null } },
    });
    for (const p of products) {
      if (!p.businessId) continue;
      const biz = await prisma.business.findUnique({
        where: { id: p.businessId },
        select: { ownerId: true },
      });
      if (!biz) continue;
      if (p.stock <= 0) {
        publishOutOfStock({
          userId: biz.ownerId,
          productId: p.id,
          businessId: p.businessId,
          productName: p.name || '',
        });
      } else {
        publishLowStock({
          userId: biz.ownerId,
          productId: p.id,
          businessId: p.businessId,
          productName: p.name || '',
          remainingStock: p.stock,
        });
      }
    }
    if (products.length > 0) logger.info(`Cron: sent ${products.length} stock alerts`);
  }

  public static async checkSetupIncomplete(): Promise<void> {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const bizs = await prisma.business.findMany({
      where: { createdAt: { lt: threshold } },
      include: { _count: { select: { hours: true } } },
    });
    for (const b of bizs) {
      const missing: string[] = [];
      if (!b.description) missing.push('description');
      if (!b.logo) missing.push('logo');
      if (b._count.hours === 0) missing.push('horaires');
      if (missing.length > 0)
        publishSetupIncomplete({ userId: b.ownerId, businessId: b.id, missingSteps: missing });
    }
  }

  public static async expireStories(): Promise<void> {
    const storiesCount = await expireOldStories();
    const feedCount = await expireOldFeedItems();
    if (storiesCount > 0 || feedCount > 0)
      logger.info(`Cron: expired ${storiesCount} stories and ${feedCount} feed items`);
  }

  public static async recalculateScores(): Promise<void> {
    try {
      await recomputeAllScores();
      logger.info('Cron: weekly score recalculation completed');
    } catch (err) {
      logger.error('Cron: score recalculation failed', { error: err });
    }
  }

  public static async checkBirthdays(): Promise<void> {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    try {
      const birthdayUsers = await prisma.$queryRawUnsafe<
        Array<{ id: string; email: string; firstName: string; lastName: string }>
      >(
        `SELECT id, email, "firstName", "lastName" FROM "User" WHERE "birthDate" IS NOT NULL AND "isActive" = true AND EXTRACT(MONTH FROM "birthDate") = $1 AND EXTRACT(DAY FROM "birthDate") = $2`,
        month,
        day
      );
      for (const u of birthdayUsers) {
        const bc = await prisma.businessClient.findMany({ where: { clientId: u.id } });
        for (const client of bc) {
          const biz = await prisma.business.findUnique({
            where: { id: client.businessId },
            select: { ownerId: true, name: true },
          });
          if (biz)
            publishClientBirthday({
              userId: biz.ownerId,
              businessId: client.businessId,
              clientName: `${u.firstName} ${u.lastName}`,
            });
        }
      }
      if (birthdayUsers.length > 0)
        logger.info(`Cron: ${birthdayUsers.length} birthday notifications sent`);
    } catch (err) {
      logger.error('Cron: birthday query failed', { error: err });
    }
  }

  public static async checkRentalReturns(): Promise<void> {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const bookings = await prisma.booking.findMany({
      where: {
        rentalId: { not: null },
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        endDate: { gte: new Date(), lte: tomorrow },
      },
      include: { rental: true, business: { select: { ownerId: true, name: true } } },
    });
    for (const b of bookings) {
      if (!b.business?.ownerId || !b.rentalId) continue;
      const daysUntilDue = Math.ceil((b.endDate!.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      publishRentalReturnReminder({
        userId: b.clientId,
        rentalId: b.rentalId,
        businessName: b.business.name,
        daysUntilDue,
      });
    }
    if (bookings.length > 0) logger.info(`Cron: sent ${bookings.length} rental return reminders`);
  }

  public static async checkDeliveryStarts(): Promise<void> {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);
    const deliveries = await prisma.delivery.findMany({
      where: { status: 'ASSIGNED', updatedAt: { lt: threshold } },
      include: { business: { select: { ownerId: true, name: true } } },
    });
    for (const d of deliveries) {
      if (!d.business?.ownerId) continue;
      const minutesElapsed = Math.floor(
        (Date.now() - new Date(d.updatedAt || d.createdAt).getTime()) / 60000
      );
      publishDeliveryNoStart({
        userId: d.business.ownerId,
        deliveryId: d.id,
        businessId: d.businessId,
        minutesElapsed,
      });
      const availableDriver = await prisma.driver.findFirst({
        where: {
          businessId: d.businessId,
          status: 'AVAILABLE',
          isActive: true,
          id: { not: d.driverId || undefined },
        },
      });
      if (availableDriver) {
        await prisma.delivery.update({
          where: { id: d.id },
          data: { driverId: availableDriver.id, updatedAt: new Date() },
        });
        await prisma.driver.update({ where: { id: availableDriver.id }, data: { status: 'BUSY' } });
        if (d.driverId)
          await prisma.driver.update({ where: { id: d.driverId }, data: { status: 'AVAILABLE' } });
        await prisma.deliveryTracking.create({
          data: {
            deliveryId: d.id,
            businessId: d.businessId,
            status: 'ASSIGNED',
            locationName: 'Réassignation automatique',
            notes: `Réassigné depuis livraison inactive`,
          },
        });
        publishDeliveryReassigned({
          userId: d.business.ownerId,
          deliveryId: d.id,
          businessId: d.businessId,
          newDriverName: availableDriver.name,
        });
      }
    }
  }

  public static async checkExpiringDocuments(): Promise<void> {
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const docs = await prisma.employeeDocument.findMany({
      where: {
        expiresAt: { lte: in30Days, gte: new Date() },
        isExpired: false,
        expiryNotified: false,
      },
      include: { employee: { select: { businessId: true, firstName: true, lastName: true } } },
    });
    for (const doc of docs) {
      const biz = await prisma.business.findUnique({
        where: { id: doc.employee.businessId },
        select: { ownerId: true },
      });
      if (!biz) continue;
      const daysUntilExpiry = Math.ceil(
        (doc.expiresAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      publishDocumentExpiring({
        userId: biz.ownerId,
        documentId: doc.id,
        employeeId: doc.employeeId,
        businessId: doc.employee.businessId,
        documentTitle: doc.title,
        daysUntilExpiry,
      });
      await prisma.employeeDocument.update({
        where: { id: doc.id },
        data: { expiryNotified: true },
      });
    }
    await prisma.employeeDocument.updateMany({
      where: { expiresAt: { lt: new Date() }, isExpired: false },
      data: { isExpired: true },
    });
    if (docs.length > 0) logger.info(`Cron: notified ${docs.length} expiring documents`);
  }

  public static async sendSatisfactionSurveys(): Promise<void> {
    // Rôle : rattrapage (le déclenchement principal se fait au DELIVERED dans
    // updateOrderStatus). Dédupliqué via satisfactionSurveySentAt : chaque commande
    // / séjour ne reçoit l'enquête qu'UNE seule fois (sinon spam quotidien).
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deliveries = await prisma.delivery.findMany({
      where: { status: 'DELIVERED', deliveredAt: { lte: yesterday } },
      include: {
        business: { select: { name: true } },
        order: {
          select: { id: true, buyerId: true, satisfactionSurveySentAt: true },
        },
      },
    });
    let sentOrders = 0;
    for (const d of deliveries) {
      const order = d.order;
      if (!order?.buyerId) continue;
      if (order.satisfactionSurveySentAt) continue; // déjà envoyée
      await prisma.order
        .update({ where: { id: order.id }, data: { satisfactionSurveySentAt: new Date() } })
        .catch(() => {});
      publishSatisfactionSurvey({
        userId: order.buyerId,
        orderId: d.orderId || undefined,
        businessName: d.business?.name || undefined,
      });
      sentOrders++;
    }
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        checkedOutAt: { lte: yesterday },
        satisfactionSurveySentAt: null,
      },
      select: { id: true, clientId: true, businessId: true },
    });
    let sentBookings = 0;
    for (const b of completedBookings) {
      await prisma.booking
        .update({ where: { id: b.id }, data: { satisfactionSurveySentAt: new Date() } })
        .catch(() => {});
      const biz = b.businessId
        ? await prisma.business
            .findUnique({ where: { id: b.businessId }, select: { name: true } })
            .catch(() => null)
        : null;
      publishSatisfactionSurvey({
        userId: b.clientId,
        bookingId: b.id,
        businessName: biz?.name || undefined,
      });
      sentBookings++;
    }
    if (sentOrders + sentBookings > 0)
      logger.info(
        `Cron: sent ${sentOrders + sentBookings} satisfaction surveys (${sentOrders} commandes, ${sentBookings} séjours)`
      );
  }

  public static async checkEscrowRelease(): Promise<void> {
    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: { status: 'DELIVERED', deliveredAt: { lte: threshold }, escrow: { status: 'HELD' } },
      include: { escrow: true, business: { select: { ownerId: true } } },
    });
    for (const o of orders) {
      if (o.escrow && o.business?.ownerId) {
        await prisma.escrow.update({
          where: { id: o.escrow.id },
          data: { status: 'RELEASED', releasedAt: new Date() },
        });
        publishEscrowReleased({
          userId: o.business.ownerId,
          escrowId: o.escrow.id,
          amount: o.escrow.amount.toString(),
        });
      }
    }
    if (orders.length > 0)
      logger.info(`Cron: auto-released ${orders.length} escrows after delivery confirmation`);
  }

  public static async checkCopilotAlerts(): Promise<void> {
    const result = await generateAllCopilotNotifications();
    if (result.created > 0)
      logger.info(
        'Cron: Copilot - ' +
          result.created +
          ' notifications generated for ' +
          result.total +
          ' businesses'
      );
  }

  public static async checkAutoEscrowRelease(): Promise<void> {
    const threshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const escrows = await prisma.escrow.findMany({
      where: {
        status: 'HELD',
        createdAt: { lte: threshold },
        orderId: null,
        invoiceId: null,
        quoteId: null,
      },
    });
    for (const escrow of escrows) {
      if (escrow.status === 'DISPUTED') continue;
      await prisma.escrow.update({
        where: { id: escrow.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          notes: 'Libération automatique après 14 jours',
        },
      });
      const biz = await prisma.business.findUnique({
        where: { id: escrow.businessId },
        select: { ownerId: true },
      });
      if (biz)
        publishEscrowReleased({
          userId: biz.ownerId,
          escrowId: escrow.id,
          amount: String(escrow.amount),
        });
    }
    if (escrows.length > 0)
      logger.info('Cron: auto-released ' + escrows.length + ' escrows after 14 days');
    const paymentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredPayments = await prisma.payment.updateMany({
      where: { status: 'VERIFYING' as const, createdAt: { lte: paymentThreshold } },
      data: { status: 'EXPIRED' as const },
    });
    if (expiredPayments.count > 0)
      logger.info('Cron: expired ' + expiredPayments.count + ' unverified payments');
  }

  public static async checkInactiveAccounts(): Promise<void> {
    try {
      const warningDays = 83;
      const deactivateDays = 90;
      const now = new Date();
      const warningThreshold = new Date(now.getTime() - warningDays * 24 * 60 * 60 * 1000);
      const deactivateThreshold = new Date(now.getTime() - deactivateDays * 24 * 60 * 60 * 1000);
      const inactiveUsers = await prisma.user.findMany({
        where: {
          lastLoginAt: { lt: deactivateThreshold },
          isActive: true,
          OR: [
            { primaryRole: 'BUSINESS' },
            { primaryRole: 'DEVELOPER' },
            { roles: { hasSome: ['BUSINESS', 'DEVELOPER'] } },
          ],
        },
        select: { id: true, email: true, firstName: true, lastLoginAt: true },
      });
      if (inactiveUsers.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: inactiveUsers.map((u) => u.id) } },
          data: { isActive: false },
        });
        logger.info(
          `Cron: désactivé ${inactiveUsers.length} comptes inactifs depuis ${deactivateDays}+ jours`
        );
      }
      const toWarn = await prisma.user.findMany({
        where: {
          lastLoginAt: { lt: warningThreshold, gte: deactivateThreshold },
          isActive: true,
          OR: [
            { primaryRole: 'BUSINESS' },
            { primaryRole: 'DEVELOPER' },
            { roles: { hasSome: ['BUSINESS', 'DEVELOPER'] } },
          ],
        },
        select: { id: true, email: true, firstName: true },
      });
      if (toWarn.length > 0)
        logger.info(`Cron: ${toWarn.length} comptes à prévenir d'inactivité imminente`);
    } catch (err) {
      logger.error('Cron: inactive accounts check failed', { error: err });
    }
  }

  public static async cleanup(): Promise<void> {
    try {
      const count = await QueueService.cleanupProcessed(7);
      await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      await CronService.cleanExpiredNotifications();
      await CronService.checkNotificationFailureRate();
      logger.info(
        `Cron: cleaned ${count} processed events, expired sessions, tokens, notifications, and checked failure rate`
      );
    } catch (err) {
      logger.error('Cron: cleanup failed', { error: err });
    }
  }

  public static async checkNotificationFailureRate(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deliveries = await prisma.notificationDelivery.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { status: true },
      });
      const total = deliveries.length;
      const failed = deliveries.filter((d) => d.status === 'failed').length;
      const rate = total > 0 ? Math.round((failed / total) * 100) : 0;
      const threshold = 10;

      if (rate > threshold) {
        const admins = await prisma.adminRoleAssignment.findMany({
          where: { role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } } },
          select: { userId: true },
        });
        const adminIds = [...new Set(admins.map((a) => a.userId))];

        for (const userId of adminIds) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId,
              type: NotificationType.SYSTEM,
              title: { contains: "Taux d'échec notifications" },
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          });
          if (!existing) {
            await prisma.notification.create({
              data: {
                userId,
                type: NotificationType.SYSTEM,
                title: `⚠️ Taux d'échec notifications: ${rate}%`,
                description: `Le taux d'échec de livraison a atteint ${rate}% (${failed}/${total}), seuil ${threshold}% dépassé.`,
                metadata: { failureRate: rate, failed, total, threshold, source: 'CronService' },
              },
            });
            logger.warn(
              `Cron: notification failure rate ${rate}% exceeded threshold ${threshold}% — alert sent to admin ${userId}`
            );
          }
        }
      }
    } catch (err) {
      logger.error('Cron: notification failure rate check failed', { error: err });
    }
  }

  public static async cleanExpiredNotifications(): Promise<void> {
    try {
      let retentionDays = 180; // défaut 180 jours
      // Lire depuis la clé 'datahub' (utilisée par la page admin data-retention)
      const datahub = await (prisma as any).platformSetting.findUnique({
        where: { key: 'datahub' },
      });
      if (datahub?.value) {
        const dh = datahub.value as { retention?: Record<string, { value: number; unit: string }> };
        const notifRetention = dh.retention?.['notifications'];
        if (notifRetention) {
          const multiplier =
            notifRetention.unit === 'months' ? 30 : notifRetention.unit === 'years' ? 365 : 1;
          retentionDays = notifRetention.value * multiplier;
        }
      }
      const threshold = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      const deleted = await prisma.notification.deleteMany({
        where: { createdAt: { lt: threshold }, read: true },
      });
      if (deleted.count > 0) {
        logger.info(`Cron: purged ${deleted.count} notifications older than ${retentionDays} days`);
        CronService.addActivity(
          'Nettoyage notifications',
          `${deleted.count} notif(s) purgée(s) (rétention ${retentionDays}j)`,
          'info'
        );
      }
    } catch (err) {
      logger.error('Cron: notification cleanup failed', { error: err });
    }
  }

  public static async generateMorningBriefs(): Promise<void> {
    try {
      const result = await generateAllMorningBriefs();
      logger.info(
        `Cron: morning briefs generated for ${result.success}/${result.total} businesses (${result.errors} errors)`
      );
    } catch (err) {
      logger.error('Cron: morning briefs generation failed', { error: err });
    }
  }

  public static async generateEveningSummaries(): Promise<void> {
    try {
      const result = await generateAllEveningSummaries();
      logger.info(
        `Cron: evening summaries generated for ${result.success}/${result.total} businesses (${result.errors} errors)`
      );
    } catch (err) {
      logger.error('Cron: evening summaries generation failed', { error: err });
    }
  }

  public static async checkUrgencyAlerts(): Promise<void> {
    const result = await checkAllBusinessesUrgency();
    logger.info(`Cron: urgency check created ${result.alertsCreated} alerts`);
  }

  public static async detectOpportunities(): Promise<void> {
    const result = await detectAllOpportunities();
    logger.info(`Cron: detected ${result.detected} new opportunities`);
  }

  public static async expireOffers(): Promise<void> {
    const now = new Date();
    const result = await prisma.offerFlash.updateMany({
      where: {
        endAt: { lt: now },
        isActive: true,
      },
      data: { isActive: false },
    });
    if (result.count > 0) {
      logger.info(`Cron: expired ${result.count} flash offers`);
    }
  }
}
