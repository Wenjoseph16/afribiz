import { AuthenticatedRequest } from '../middlewares/auth';
import { notificationRepository } from '../repositories/notificationRepository';
import { notificationPreferenceRepository } from '../repositories/notificationPreferenceRepository';
import { successResponse } from '../utils/response';
import { AppError } from '../middlewares/errorHandler';
import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { prisma } from '../lib/db';
import { sendEmail, emailTemplates } from '../lib/mail';
import { logger } from '../lib/logger';
import { NotificationType } from '@prisma/client';
import { getActiveAdminIds } from '../services/adminService';

export const getNotifications = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    const { read, type, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));

    const filter: any = {
      userId,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    };

    if (read === 'true') filter.read = true;
    else if (read === 'false') filter.read = false;
    if (type) filter.type = (type as string).split(',');

    const { notifications, total } = await notificationRepository.findMany(filter);
    const unreadCount = await notificationRepository.countUnread(userId);

    res.json(
      successResponse({
        notifications,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        unreadCount,
      })
    );
  }
);

export const markNotificationRead = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    await notificationRepository.markAsRead(req.params.id, req.user!.id);
    res.json(successResponse(null, 'Notification marquée comme lue'));
  }
);

export const markAllNotificationsRead = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    await notificationRepository.markAllAsRead(req.user!.id);
    res.json(successResponse(null, 'Toutes les notifications marquées comme lues'));
  }
);

export const markMultipleNotificationsRead = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('ids doit être un tableau non vide', 400);
    }
    await notificationRepository.markMultipleAsRead(ids, req.user!.id);
    res.json(successResponse(null, `${ids.length} notification(s) marquée(s) comme lue(s)`));
  }
);

export const deleteNotification = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await notificationRepository.delete(req.params.id, req.user!.id);
    if (!deleted) {
      throw new AppError('Notification introuvable', 404);
    }
    res.json(successResponse(null, 'Notification supprimée'));
  }
);

export const getUnreadCount = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const count = await notificationRepository.countUnread(req.user!.id);
  res.json(successResponse({ count }));
});

export const getPreferences = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const prefs = await notificationPreferenceRepository.getPreferences(req.user!.id);
  res.json(successResponse(prefs));
});

export const updatePreferences = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      throw new AppError('Format invalide', 400);
    }

    await notificationPreferenceRepository.bulkUpdate(req.user!.id, preferences);
    res.json(successResponse(null, 'Préférences mises à jour'));
  }
);

export const initDefaultPreferences = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    await notificationPreferenceRepository.setDefaults(req.user!.id);
    res.json(successResponse(null, 'Préférences par défaut initialisées'));
  }
);

export const getNotificationAnalytics = catchAsyncErrors(
  async (_req: AuthenticatedRequest, res: Response) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const notifications = await prisma.notification.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, type: true, read: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Volume par jour (30 derniers jours)
    const volumeByDay: { date: string; count: number; read: number; unread: number }[] = [];
    const dayMap = new Map<string, { count: number; read: number; unread: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayMap.set(key, { count: 0, read: 0, unread: 0 });
    }
    for (const n of notifications) {
      const key = n.createdAt.toISOString().split('T')[0];
      const entry = dayMap.get(key);
      if (entry) {
        entry.count++;
        if (n.read) entry.read++;
        else entry.unread++;
      }
    }
    const sortedKeys = Array.from(dayMap.keys()).sort();
    for (const key of sortedKeys) {
      const entry = dayMap.get(key)!;
      volumeByDay.push({ date: key, ...entry });
    }

    // Distribution par type
    const typeCount = new Map<string, number>();
    for (const n of notifications) typeCount.set(n.type, (typeCount.get(n.type) || 0) + 1);
    const typeDistribution = Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Statistiques globales
    const totalGlobal = await prisma.notification.count();
    const readGlobal = await prisma.notification.count({ where: { read: true } });
    const unreadGlobal = totalGlobal - readGlobal;

    // Stats de livraison via NotificationDelivery
    const deliveryCounts = await prisma.notificationDelivery.groupBy({
      by: ['status'],
      _count: true,
    });
    const deliveryStats = {
      sent: deliveryCounts.find((d) => d.status === 'sent')?._count ?? 0,
      pending: deliveryCounts.find((d) => d.status === 'pending')?._count ?? 0,
      failed: deliveryCounts.find((d) => d.status === 'failed')?._count ?? 0,
    };

    // Distribution par canal via NotificationDelivery
    const channelDistribution = await prisma.notificationDelivery.groupBy({
      by: ['channel'],
      _count: true,
    });
    const totalByChannel = channelDistribution.map((cd) => ({
      channel: cd.channel,
      count: cd._count,
    }));

    // Distribution par type + canal via NotificationDelivery + Notification join
    const deliveriesWithType = await prisma.notificationDelivery.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        channel: true,
        notification: { select: { type: true } },
      },
    });
    const typeChannelMap = new Map<string, number>();
    for (const d of deliveriesWithType) {
      const key = `${d.notification.type}:${d.channel}`;
      typeChannelMap.set(key, (typeChannelMap.get(key) || 0) + 1);
    }
    const typeChannelDistribution = Array.from(typeChannelMap.entries()).map(([key, count]) => {
      const [type, channel] = key.split(':');
      return { type, channel, count };
    });

    // Tendance (7 derniers jours vs 7 précédents)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const recentCount = notifications.filter((n) => n.createdAt >= sevenDaysAgo).length;
    const previousCount = notifications.filter(
      (n) => n.createdAt >= fourteenDaysAgo && n.createdAt < sevenDaysAgo
    ).length;
    const trend =
      previousCount > 0 ? Math.round(((recentCount - previousCount) / previousCount) * 100) : 0;

    // Failure rate by day (for chart) — 1 requête au lieu de 30
    const thirtyDaysAgoFull = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const allDeliveries = await prisma.notificationDelivery.findMany({
      where: { createdAt: { gte: thirtyDaysAgoFull } },
      select: { status: true, createdAt: true },
    });
    const failureRateByDay: { date: string; rate: number; total: number; failed: number }[] = [];
    // Grouper par jour en mémoire
    const dayGroups = new Map<string, { total: number; failed: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dayGroups.set(key, { total: 0, failed: 0 });
    }
    for (const dlv of allDeliveries) {
      const key = dlv.createdAt.toISOString().split('T')[0];
      const group = dayGroups.get(key);
      if (group) {
        group.total++;
        if (dlv.status === 'failed') group.failed++;
      }
    }
    for (const [date, group] of dayGroups) {
      failureRateByDay.push({
        date,
        rate: group.total > 0 ? Math.round((group.failed / group.total) * 100) : 0,
        total: group.total,
        failed: group.failed,
      });
    }

    res.json(
      successResponse({
        summary: {
          total: totalGlobal,
          unread: unreadGlobal,
          read: readGlobal,
          readRate: totalGlobal > 0 ? Math.round((readGlobal / totalGlobal) * 100) : 0,
          last30Days: notifications.length,
          trend,
          deliverySuccessRate:
            deliveryStats.sent + deliveryStats.failed > 0
              ? Math.round((deliveryStats.sent / (deliveryStats.sent + deliveryStats.failed)) * 100)
              : 100,
          failureRate:
            deliveryStats.sent + deliveryStats.failed > 0
              ? Math.round(
                  (deliveryStats.failed / (deliveryStats.sent + deliveryStats.failed)) * 100
                )
              : 0,
        },
        volumeByDay,
        typeDistribution,
        deliveryStats,
        totalByChannel,
        typeChannelDistribution,
        failureRateByDay,
      })
    );
  }
);

export const exportNotificationsCSV = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const notifications = await prisma.notification.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, type: true, title: true, description: true, read: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const header = 'ID;Type;Titre;Description;Lue;Date\n';
    const rows = notifications
      .map((n) => {
        const title = `"${(n.title || '').replace(/"/g, '""')}"`;
        const desc = `"${(n.description || '').replace(/"/g, '""')}"`;
        return `${n.id};${n.type};${title};${desc};${n.read ? 'Oui' : 'Non'};${n.createdAt.toISOString()}`;
      })
      .join('\n');

    const csv = '\uFEFF' + header + rows;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="notifications-export.csv"');
    res.send(csv);
  }
);

// ============== PUSH SUBSCRIPTION ==============

export const savePushSubscription = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      throw new AppError('Subscription invalide (endpoint + keys requis)', 400);
    }
    const userId = req.user!.id;
    await prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId, endpoint: subscription.endpoint } },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: req.headers['user-agent'] || null,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: req.headers['user-agent'] || null,
      },
    });
    const count = await prisma.pushSubscription.count({ where: { userId } });
    res.json(successResponse({ count }, 'Abonnement push enregistré'));
  }
);

export const getPushSubscriptions = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: req.user!.id },
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        userAgent: true,
        createdAt: true,
      },
    });
    res.json(successResponse({ subscriptions }));
  }
);

export const deletePushSubscription = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { endpoint } = req.body;
    if (!endpoint) throw new AppError('endpoint requis', 400);
    const result = await prisma.pushSubscription.deleteMany({
      where: { userId: req.user!.id, endpoint },
    });
    res.json(
      successResponse(
        { deleted: result.count > 0 },
        result.count > 0 ? 'Abonnement push supprimé' : 'Aucun abonnement trouvé'
      )
    );
  }
);

export const checkNotificationFailureRate = catchAsyncErrors(
  async (_req: AuthenticatedRequest, res: Response) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deliveries = await prisma.notificationDelivery.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { status: true },
    });

    const total = deliveries.length;
    const failed = deliveries.filter((d) => d.status === 'failed').length;
    const rate = total > 0 ? Math.round((failed / total) * 100) : 0;
    const threshold = 10;

    // Résoudre les admins une seule fois (notification + email)
    const adminIds = rate > threshold ? await getActiveAdminIds() : [];

    if (rate > threshold) {
      // 1 requête au lieu de N — trouver toutes les notifications existantes en une fois
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existingNotifications =
        adminIds.length > 0
          ? await prisma.notification.findMany({
              where: {
                userId: { in: adminIds },
                type: NotificationType.SYSTEM,
                title: { contains: "Taux d'échec notifications" },
                createdAt: { gte: yesterday },
              },
              select: { userId: true },
            })
          : [];
      const existingUserIds = new Set(existingNotifications.map((n) => n.userId));

      // Créer uniquement pour ceux qui n'ont pas encore reçu l'alerte
      const newAlertIds = adminIds.filter((id) => !existingUserIds.has(id));
      if (newAlertIds.length > 0) {
        await prisma.notification.createMany({
          data: newAlertIds.map((userId) => ({
            userId,
            type: NotificationType.SYSTEM,
            title: `⚠️ Taux d'échec notifications: ${rate}%`,
            description: `Le taux d'échec de livraison des notifications a atteint ${rate}% (${failed}/${total}), dépassant le seuil de ${threshold}%.`,
            metadata: {
              failureRate: rate,
              failed,
              total,
              threshold,
              source: 'NotificationAnalytics',
            },
          })),
        });
      }
    }

    // Send email alert to admins if threshold exceeded
    if (rate > threshold) {
      try {
        const adminUsers = adminIds.length
          ? await prisma.user.findMany({
              where: { id: { in: adminIds } },
              select: { email: true, firstName: true },
            })
          : [];
        const adminEmails = [
          ...new Set(adminUsers.map((u) => u.email).filter(Boolean)),
        ] as string[];
        for (const email of adminEmails) {
          const tpl = emailTemplates.notificationFailureAlert(
            'Admin',
            rate,
            failed,
            total,
            threshold
          );
          sendEmail(email, tpl.subject, tpl.html).catch(() => {});
        }
      } catch (err) {
        logger.error('Failed to send email alert for notification failure rate', { error: err });
      }
    }

    res.json(
      successResponse({
        total,
        failed,
        rate,
        threshold,
        alertSent: rate > threshold,
        message:
          rate > threshold
            ? `⚠️ Taux d'échec ${rate}% > seuil ${threshold}% — alerte email envoyée`
            : `✅ Taux d'échec ${rate}% < seuil ${threshold}%`,
      })
    );
  }
);
