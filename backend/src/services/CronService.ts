import cron from 'node-cron';
import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import {
  publishBookingReminder,
  publishDebtOverdue,
  publishSubscriptionExpiring,
  publishClientInactive,
  publishCartAbandoned,
  publishRentalOverdue,
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
import { QueueService } from '../events/QueueService';
import { recomputeAllScores } from './afriScoreService';
import { generateAllCopilotNotifications } from './copilotNotificationService';

export class CronService {
  private static started = false;

  static start(): void {
    if (CronService.started) return;
    CronService.started = true;

    logger.info('CronService: starting scheduled jobs');

    cron.schedule('*/15 * * * *', () => {
      CronService.checkBookingReminders().catch(err => logger.error('Cron: booking reminders failed', { error: err }));
    });
    cron.schedule('0 6 * * *', () => {
      CronService.checkOverdueDebts().catch(err => logger.error('Cron: overdue debts failed', { error: err }));
    });
    cron.schedule('* * * * *', () => {
      CronService.dispatchCampaigns().catch(err => logger.error('Cron: campaign dispatch failed', { error: err }));
    });
    cron.schedule('*/5 * * * *', () => {
      CronService.checkPendingOrders().catch(err => logger.error('Cron: pending orders failed', { error: err }));
    });
    cron.schedule('*/30 * * * *', () => {
      CronService.checkAbandonedCarts().catch(err => logger.error('Cron: abandoned carts failed', { error: err }));
    });
    cron.schedule('0 7 * * *', () => {
      CronService.checkInactiveClients().catch(err => logger.error('Cron: inactive clients failed', { error: err }));
    });
    cron.schedule('30 7 * * *', () => {
      CronService.checkCopilotAlerts().catch(err => logger.error('Cron: copilot alerts failed', { error: err }));
    });
    cron.schedule('0 8 * * *', () => {
      CronService.checkExpiringSubscriptions().catch(err => logger.error('Cron: expiring subscriptions failed', { error: err }));
    });
    cron.schedule('0 9 * * *', () => {
      CronService.checkExpiringTrials().catch(err => logger.error('Cron: expiring trials failed', { error: err }));
    });
    cron.schedule('30 6 * * *', () => {
      CronService.checkOverdueRentals().catch(err => logger.error('Cron: overdue rentals failed', { error: err }));
    });
    cron.schedule('0 9 * * *', () => {
      CronService.checkLowStock().catch(err => logger.error('Cron: low stock failed', { error: err }));
    });
    cron.schedule('0 10 * * *', () => {
      CronService.checkSetupIncomplete().catch(err => logger.error('Cron: setup incomplete failed', { error: err }));
    });
    cron.schedule('0 8 * * *', () => {
      CronService.checkBirthdays().catch(err => logger.error('Cron: birthday check failed', { error: err }));
    });
    cron.schedule('0 7 * * *', () => {
      CronService.checkRentalReturns().catch(err => logger.error('Cron: rental returns failed', { error: err }));
    });
    cron.schedule('*/15 * * * *', () => {
      CronService.checkDeliveryStarts().catch(err => logger.error('Cron: delivery start check failed', { error: err }));
    });
    cron.schedule('0 6 * * *', () => {
      CronService.checkExpiringDocuments().catch(err => logger.error('Cron: expiring docs failed', { error: err }));
    });
    cron.schedule('0 7 * * *', () => {
      CronService.sendSatisfactionSurveys().catch(err => logger.error('Cron: satisfaction surveys failed', { error: err }));
    });
    cron.schedule('0 10 * * *', () => {
      CronService.checkEscrowRelease().catch(err => logger.error('Cron: escrow release failed', { error: err }));
    });
    cron.schedule('30 10 * * *', () => {
      CronService.checkAutoEscrowRelease().catch(err => logger.error('Cron: auto escrow release failed', { error: err }));
    });
    cron.schedule('*/15 * * * *', () => {
      CronService.expireStories().catch(err => logger.error('Cron: story expiration failed', { error: err }));
    });
    cron.schedule('0 0 * * *', () => {
      CronService.recalculateScores().catch(err => logger.error('Cron: score recalculation failed', { error: err }));
    });
    cron.schedule('0 3 * * 0', () => {
      CronService.cleanup().catch(err => logger.error('Cron: cleanup failed', { error: err }));
    });
    cron.schedule('0 5 * * *', () => {
      CronService.checkInactiveAccounts().catch(err => logger.error('Cron: inactive accounts check failed', { error: err }));
    });

    logger.info('CronService: all jobs scheduled');
  }

  private static async checkBookingReminders(): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const bookings = await prisma.booking.findMany({
      where: { status: 'CONFIRMED', startDate: { gte: now, lte: in24h }, reminderSent: false, businessId: { not: null } },
    });
    for (const b of bookings) {
      if (!b.businessId) continue;
      const biz = await prisma.business.findUnique({ where: { id: b.businessId }, select: { ownerId: true, name: true } });
      if (!biz) continue;
      publishBookingReminder({ userId: biz.ownerId, bookingId: b.id, businessName: biz.name || '' });
      await prisma.booking.update({ where: { id: b.id }, data: { reminderSent: true, remindedAt: now } });
    }
    if (bookings.length > 0) logger.info(`Cron: sent ${bookings.length} booking reminders`);
  }

  private static async checkPendingOrders(): Promise<void> {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5-minute window per reminder level
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
        // Only check orders created within the last 65 min (avoid touching old abandoned orders)
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
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'Annulation automatique - delai de reponse depasse' },
        });
        publishOrderAutoCancelled({ userId: order.buyerId, orderId: order.id, businessName: order.business.name, businessId: order.businessId });
        publishOrderAutoCancelled({ userId: order.business.ownerId, orderId: order.id, businessName: order.business.name, businessId: order.businessId });
        logger.info('Cron: auto-cancelled order ' + order.orderNumber + ' after 60 min');
      } else if (elapsed >= urgentReminderStart && elapsed < urgentReminderEnd) {
        publishOrderPendingReminder({
          userId: order.business.ownerId, orderId: order.id,
          businessName: order.business.name, amount: order.totalAmount.toString(),
          businessId: order.businessId, minutesElapsed: Math.floor(elapsed / 60000), reminderLevel: 'urgent',
        });
        await prisma.order.update({ where: { id: order.id }, data: { updatedAt: new Date() } });
        logger.info('Cron: sent urgent reminder for order ' + order.orderNumber);
      } else if (elapsed >= firstReminderStart && elapsed < firstReminderEnd) {
        publishOrderPendingReminder({
          userId: order.business.ownerId, orderId: order.id,
          businessName: order.business.name, amount: order.totalAmount.toString(),
          businessId: order.businessId, minutesElapsed: Math.floor(elapsed / 60000), reminderLevel: 'first',
        });
        await prisma.order.update({ where: { id: order.id }, data: { updatedAt: new Date() } });
        logger.info('Cron: sent first reminder for order ' + order.orderNumber);
      }
    }
    if (pendingOrders.length > 0) logger.info('Cron: checked ' + pendingOrders.length + ' pending orders');
  }

  private static async checkOverdueDebts(): Promise<void> {
    const overdue = await prisma.debt.findMany({
      where: { status: 'ACTIVE', dueDate: { lt: new Date() }, remainingAmount: { gt: 0 } },
    });
    for (const d of overdue) {
      const biz = await prisma.business.findUnique({ where: { id: d.businessId }, select: { ownerId: true, name: true } });
      if (!biz) continue;
      publishDebtOverdue({ userId: biz.ownerId, debtId: d.id, businessId: d.businessId, amount: d.totalAmount.toString() });
    }
    if (overdue.length > 0) logger.info(`Cron: flagged ${overdue.length} overdue debts`);
  }

  private static async dispatchCampaigns(): Promise<void> {
    const now = new Date();
    const campaigns = await prisma.marketingCampaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
    });
    for (const c of campaigns) {
      const biz = await prisma.business.findUnique({ where: { id: c.businessId }, select: { ownerId: true, name: true } });
      if (!biz) continue;
      publishCampaignScheduled({ userId: biz.ownerId, businessId: c.businessId, campaignId: c.id });
      await prisma.marketingCampaign.update({ where: { id: c.id }, data: { status: 'COMPLETED', sentAt: now } });
    }
    if (campaigns.length > 0) logger.info(`Cron: dispatched ${campaigns.length} campaigns`);
  }

  private static async checkAbandonedCarts(): Promise<void> {
    const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: { status: 'PENDING', createdAt: { lt: threshold }, buyerId: { not: null }, businessId: { not: null } },
    });
    for (const o of orders) {
      if (!o.buyerId || !o.businessId) continue;
      const biz = await prisma.business.findUnique({ where: { id: o.businessId }, select: { ownerId: true } });
      if (!biz) continue;
      publishCartAbandoned({ userId: o.buyerId, businessId: o.businessId, orderId: o.id, amount: o.totalAmount.toString() });
    }
    if (orders.length > 0) logger.info(`Cron: detected ${orders.length} abandoned carts`);
  }

  private static async checkInactiveClients(): Promise<void> {
    const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: { createdAt: { lt: threshold }, buyerId: { not: null }, businessId: { not: null } },
      select: { buyerId: true, businessId: true },
      distinct: ['buyerId', 'businessId'],
    });
    for (const o of orders) {
      if (!o.buyerId || !o.businessId) continue;
      const biz = await prisma.business.findUnique({ where: { id: o.businessId }, select: { ownerId: true } });
      if (!biz) continue;
      publishClientInactive({ userId: biz.ownerId, businessId: o.businessId, daysInactive: 90 });
    }
  }

  private static async checkExpiringTrials(): Promise<void> {
    const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const installations = await prisma.developerModuleInstallation.findMany({
      where: {
        status: 'TRIAL',
        settings: { path: ['isTrial'], equals: true },
      },
      include: {
        module: { select: { name: true, developerId: true } },
        business: { select: { ownerId: true, name: true } },
      },
    });

    for (const inst of installations) {
      const settings = inst.settings as { isTrial?: boolean; trialEndsAt?: string; lastTrialNotified?: string } | null;
      if (!settings?.trialEndsAt) continue;
      const trialEndsAt = new Date(settings.trialEndsAt);
      const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Notify at 2 days left, 1 day left, and on expiry day
      if (daysLeft === 2 || daysLeft === 1 || daysLeft === 0) {
        // Already notified today? Check via a simple flag in settings
        const lastNotified = settings.lastTrialNotified ? new Date(settings.lastTrialNotified) : null;
        if (lastNotified && lastNotified.toDateString() === now.toDateString()) continue;

        publishTrialExpiring({
          userId: inst.business.ownerId,
          businessId: inst.businessId,
          moduleId: inst.moduleId,
          moduleName: inst.module.name,
          daysLeft: Math.max(0, daysLeft),
        });

        // Update last notified date
        await prisma.developerModuleInstallation.update({
          where: { id: inst.id },
          data: {
            settings: {
              ...settings,
              lastTrialNotified: now.toISOString(),
            },
          },
        });
      }

      // Auto-expire trials that have ended
      if (daysLeft < 0) {
        await prisma.developerModuleInstallation.update({
          where: { id: inst.id },
          data: {
            status: 'EXPIRED',
            settings: {
              ...settings,
              expiredAt: now.toISOString(),
            },
          },
        });
        logger.info(`Cron: expired trial for module ${inst.module.name} (business: ${inst.business.name})`);
      }
    }
  }

  private static async checkExpiringSubscriptions(): Promise<void> {
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const subs = await prisma.businessSubscription.findMany({
      where: { status: 'ACTIVE', endDate: { lte: in7Days, gte: new Date() } },
    });
    for (const s of subs) {
      if (!s.endDate) continue;
      const biz = await prisma.business.findUnique({ where: { id: s.businessId }, select: { ownerId: true } });
      if (!biz) continue;
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: s.planId }, select: { name: true } });
      const daysUntil = Math.ceil((s.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      publishSubscriptionExpiring({ userId: biz.ownerId, subscriptionId: s.id, planName: plan?.name || 'Abonnement', daysUntilExpiry: daysUntil });
    }
  }

  private static async checkOverdueRentals(): Promise<void> {
    const rentals = await prisma.rental.findMany({ where: { isActive: true } });
    if (rentals.length > 0) logger.debug(`Cron: found ${rentals.length} active rentals (overdue check requires schema extension)`);
  }

  private static async checkLowStock(): Promise<void> {
    const products = await prisma.product.findMany({
      where: { stock: { lte: 5 }, isActive: true, businessId: { not: null } },
    });
    for (const p of products) {
      if (!p.businessId) continue;
      const biz = await prisma.business.findUnique({ where: { id: p.businessId }, select: { ownerId: true } });
      if (!biz) continue;
      if (p.stock <= 0) {
        publishOutOfStock({ userId: biz.ownerId, productId: p.id, businessId: p.businessId, productName: p.name || '' });
      } else {
        publishLowStock({ userId: biz.ownerId, productId: p.id, businessId: p.businessId, productName: p.name || '', remainingStock: p.stock });
      }
    }
    if (products.length > 0) logger.info(`Cron: sent ${products.length} stock alerts`);
  }

  private static async checkSetupIncomplete(): Promise<void> {
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
      if (missing.length > 0) {
        publishSetupIncomplete({ userId: b.ownerId, businessId: b.id, missingSteps: missing });
      }
    }
  }

  private static async expireStories(): Promise<void> {
    const storiesCount = await expireOldStories();
    const feedCount = await expireOldFeedItems();
    if (storiesCount > 0 || feedCount > 0) {
      logger.info(`Cron: expired ${storiesCount} stories and ${feedCount} feed items`);
    }
  }

  private static async recalculateScores(): Promise<void> {
    try {
      await recomputeAllScores();
      logger.info('Cron: weekly score recalculation completed');
    } catch (err) {
      logger.error('Cron: score recalculation failed', { error: err });
    }
  }

  private static async checkBirthdays(): Promise<void> {
    // Requête directe via SQL raw pour filtrer par jour/mois de birthDate
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    try {
      const birthdayUsers = await prisma.$queryRawUnsafe<Array<{ id: string; email: string; firstName: string; lastName: string }>>(
        `SELECT id, email, "firstName", "lastName" FROM "User" WHERE "birthDate" IS NOT NULL AND "isActive" = true AND EXTRACT(MONTH FROM "birthDate") = $1 AND EXTRACT(DAY FROM "birthDate") = $2`,
        month, day
      );
      for (const u of birthdayUsers) {
        const bc = await prisma.businessClient.findMany({ where: { clientId: u.id } });
        for (const client of bc) {
          const biz = await prisma.business.findUnique({ where: { id: client.businessId }, select: { ownerId: true, name: true } });
          if (biz) {
            publishClientBirthday({ userId: biz.ownerId, businessId: client.businessId, clientName: `${u.firstName} ${u.lastName}` });
          }
        }
      }
      if (birthdayUsers.length > 0) logger.info(`Cron: ${birthdayUsers.length} birthday notifications sent`);
    } catch (err) {
      logger.error('Cron: birthday query failed', { error: err });
    }
  }

  private static async checkRentalReturns(): Promise<void> {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const bookings = await prisma.booking.findMany({
      where: {
        rentalId: { not: null },
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        endDate: {
          gte: new Date(),
          lte: tomorrow,
        },
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

  private static async checkDeliveryStarts(): Promise<void> {
    const threshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: 'ASSIGNED',
        updatedAt: { lt: threshold },
      },
      include: { business: { select: { ownerId: true, name: true } } },
    });
    for (const d of deliveries) {
      if (!d.business?.ownerId) continue;
      const minutesElapsed = Math.floor((Date.now() - new Date(d.updatedAt || d.createdAt).getTime()) / 60000);
      publishDeliveryNoStart({
        userId: d.business.ownerId,
        deliveryId: d.id,
        businessId: d.businessId,
        minutesElapsed,
      });
      // Auto-reassign to another available driver
      const availableDriver = await prisma.driver.findFirst({
        where: { businessId: d.businessId, status: 'AVAILABLE', isActive: true, id: { not: d.driverId || undefined } },
      });
      if (availableDriver) {
        await prisma.delivery.update({ where: { id: d.id }, data: { driverId: availableDriver.id, assignedAt: new Date() } as any });
        await prisma.driver.update({ where: { id: availableDriver.id }, data: { status: 'BUSY' } });
        if (d.driverId) {
          await prisma.driver.update({ where: { id: d.driverId }, data: { status: 'AVAILABLE' } });
        }
        await prisma.deliveryTracking.create({
          data: { deliveryId: d.id, businessId: d.businessId, status: 'ASSIGNED', locationName: 'Réassignation automatique', notes: `Réassigné depuis livraison inactive` },
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

  private static async checkExpiringDocuments(): Promise<void> {
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
      const biz = await prisma.business.findUnique({ where: { id: doc.employee.businessId }, select: { ownerId: true } });
      if (!biz) continue;
      const daysUntilExpiry = Math.ceil((doc.expiresAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      publishDocumentExpiring({
        userId: biz.ownerId,
        documentId: doc.id,
        employeeId: doc.employeeId,
        businessId: doc.employee.businessId,
        documentTitle: doc.title,
        daysUntilExpiry,
      });
      await prisma.employeeDocument.update({ where: { id: doc.id }, data: { expiryNotified: true } });
    }
    // Mark expired docs
    await prisma.employeeDocument.updateMany({
      where: { expiresAt: { lt: new Date() }, isExpired: false },
      data: { isExpired: true },
    });
    if (docs.length > 0) logger.info(`Cron: notified ${docs.length} expiring documents`);
  }

  private static async sendSatisfactionSurveys(): Promise<void> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deliveries = await prisma.delivery.findMany({
      where: {
        status: 'DELIVERED',
        deliveredAt: { lte: yesterday },
      },
      include: { business: { select: { ownerId: true, name: true } }, order: { select: { buyerId: true } } },
    });
    for (const d of deliveries) {
      if (d.order?.buyerId) {
        publishSatisfactionSurvey({
          userId: d.order.buyerId,
          orderId: d.orderId || undefined,
        });
      }
    }
    // Also check completed bookings
    const completedBookings = await prisma.booking.findMany({
      where: { status: 'COMPLETED', checkedOutAt: { lte: yesterday } },
      select: { id: true, clientId: true },
    });
    for (const b of completedBookings) {
      publishSatisfactionSurvey({
        userId: b.clientId,
        bookingId: b.id,
      });
    }
    if (deliveries.length + completedBookings.length > 0) {
      logger.info(`Cron: sent ${deliveries.length + completedBookings.length} satisfaction surveys`);
    }
  }

  private static async checkEscrowRelease(): Promise<void> {
    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48h after delivery
    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        deliveredAt: { lte: threshold },
        escrow: { status: 'HELD' },
      },
      include: { escrow: true, business: { select: { ownerId: true } } },
    });
    for (const o of orders) {
      if (o.escrow && o.business?.ownerId) {
        await prisma.escrow.update({ where: { id: o.escrow.id }, data: { status: 'RELEASED', releasedAt: new Date() } });
        publishEscrowReleased({ userId: o.business.ownerId, escrowId: o.escrow.id, amount: o.escrow.amount.toString() });
      }
    }
    if (orders.length > 0) logger.info(`Cron: auto-released ${orders.length} escrows after delivery confirmation`);
  }

  private static async checkCopilotAlerts(): Promise<void> {
    const result = await generateAllCopilotNotifications();
    if (result.created > 0) {
      logger.info('Cron: Copilot - ' + result.created + ' notifications generated for ' + result.total + ' businesses');
    }
  }

  private static async checkAutoEscrowRelease(): Promise<void> {
    // Escrows sans commande/facture/devis associée (services, freelance) → auto-release après 14 jours
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
      // Ne libérer que si aucun litige en cours
      if (escrow.status === 'DISPUTED') continue;

      await prisma.escrow.update({
        where: { id: escrow.id },
        data: { status: 'RELEASED', releasedAt: new Date(), notes: 'Libération automatique après 14 jours' },
      });

      const biz = await prisma.business.findUnique({ where: { id: escrow.businessId }, select: { ownerId: true } });
      if (biz) {
        publishEscrowReleased({ userId: biz.ownerId, escrowId: escrow.id, amount: String(escrow.amount) });
      }
    }
    if (escrows.length > 0) logger.info('Cron: auto-released ' + escrows.length + ' escrows after 14 days');

    // Expirer les paiements en attente de vérification depuis + de 7 jours
    const paymentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expiredPayments = await prisma.payment.updateMany({
      where: { status: 'VERIFYING' as any, createdAt: { lte: paymentThreshold } },
      data: { status: 'EXPIRED' as any },
    });
    if (expiredPayments.count > 0) logger.info('Cron: expired ' + expiredPayments.count + ' unverified payments');
  }

  private static async checkInactiveAccounts(): Promise<void> {
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
          where: { id: { in: inactiveUsers.map(u => u.id) } },
          data: { isActive: false },
        });
        logger.info(`Cron: désactivé ${inactiveUsers.length} comptes inactifs depuis ${deactivateDays}+ jours`);
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

      if (toWarn.length > 0) {
        logger.info(`Cron: ${toWarn.length} comptes à prévenir d'inactivité imminente`);
      }
    } catch (err) {
      logger.error('Cron: inactive accounts check failed', { error: err });
    }
  }

  private static async cleanup(): Promise<void> {
    try {
      const count = await QueueService.cleanupProcessed(7);
      await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
      logger.info(`Cron: cleaned ${count} processed events, expired sessions and tokens`);
    } catch (err) {
      logger.error('Cron: cleanup failed', { error: err });
    }
  }
}
