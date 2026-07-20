import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { eventBus } from '../events/EventBus';
import { DomainEvent, DomainEventType } from '../events/events';

const EVENT_TO_CAMPAIGN_TRIGGER: Record<string, string> = {
  [DomainEventType.ORDER_PLACED]: 'ORDER_PLACED',
  [DomainEventType.ORDER_CONFIRMED]: 'ORDER_CONFIRMED',
  [DomainEventType.PAYMENT_RECEIVED]: 'PAYMENT_RECEIVED',
  [DomainEventType.BOOKING_CREATED]: 'BOOKING_MADE',
  [DomainEventType.BOOKING_CONFIRMED]: 'BOOKING_CONFIRMED',
  [DomainEventType.REVIEW_PUBLISHED]: 'REVIEW_PUBLISHED',
  [DomainEventType.NEW_CLIENT]: 'NEW_CLIENT',
  [DomainEventType.CLIENT_INACTIVE]: 'CLIENT_INACTIVE',
  [DomainEventType.SUBSCRIPTION_EXPIRING]: 'SUBSCRIPTION_EXPIRING',
  [DomainEventType.LOW_STOCK]: 'STOCK_LOW',
  [DomainEventType.OUT_OF_STOCK]: 'STOCK_OUT',
  [DomainEventType.BACK_IN_STOCK]: 'STOCK_BACK_IN',
  [DomainEventType.BADGE_EARNED]: 'BADGE_EARNED',
  [DomainEventType.CART_ABANDONED]: 'ORDER_PLACED',
  [DomainEventType.CLIENT_BIRTHDAY]: 'CLIENT_INACTIVE',
};

export class CampaignEngineService {
  private static initialized = false;
  private static intervalId: NodeJS.Timeout | null = null;

  static start(): void {
    if (CampaignEngineService.initialized) return;
    CampaignEngineService.initialized = true;
    logger.info('CampaignEngineService: demarrage');

    eventBus.subscribeToAll(async (event: DomainEvent) => {
      await CampaignEngineService.processEvent(event);
    });

    // Check every 5 minutes for scheduled campaigns
    CampaignEngineService.intervalId = setInterval(
      async () => {
        await CampaignEngineService.processScheduledCampaigns();
        await CampaignEngineService.processPendingSteps();
      },
      5 * 60 * 1000
    );

    logger.info('CampaignEngineService: demarre avec succes');
  }

  static async processEvent(event: DomainEvent): Promise<void> {
    const trigger = EVENT_TO_CAMPAIGN_TRIGGER[event.type];
    if (!trigger) return;
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          trigger: trigger as any,
          status: 'ACTIVE' as any,
          businessId: event.metadata?.businessId || undefined,
        },
        include: { steps: { where: { isActive: true }, orderBy: { stepOrder: 'asc' } } },
      });
      for (const campaign of campaigns) {
        await CampaignEngineService.executeFirstStep(campaign, event);
      }
    } catch (err) {
      logger.error('CampaignEngine: erreur traitement event', { error: err });
    }
  }

  static async executeFirstStep(campaign: any, event: DomainEvent): Promise<void> {
    if (!campaign.steps || campaign.steps.length === 0) return;
    const firstStep = campaign.steps[0];
    await CampaignEngineService.executeStepWithDelay(firstStep, campaign, event);
    // Schedule remaining steps
    for (let i = 1; i < campaign.steps.length; i++) {
      const step = campaign.steps[i];
      const delayMs = CampaignEngineService.calculateDelayMs(step);
      const scheduledAt = new Date(Date.now() + delayMs);
      // Persist as SCHEDULED before setTimeout (crash recovery)
      const log = await prisma.campaignExecutionLog.create({
        data: {
          campaignId: campaign.id,
          stepId: step.id,
          userId: event.userId,
          businessId: event.metadata?.businessId,
          result: 'SCHEDULED',
          metadata: {
            scheduledAt: scheduledAt.toISOString(),
            actionType: step.actionType,
            actionConfig: step.actionConfig,
            stepName: step.name,
            eventType: event.type,
            eventPayload: JSON.parse(JSON.stringify(event.payload)),
          } as any,
        },
      });
      setTimeout(async () => {
        try {
          await CampaignEngineService.executeStepAction(step, campaign, event);
          await prisma.campaignExecutionLog.update({
            where: { id: log.id },
            data: { result: 'SUCCESS' },
          });
        } catch (err: any) {
          await prisma.campaignExecutionLog.update({
            where: { id: log.id },
            data: { result: 'FAILED', error: err.message },
          });
        }
      }, delayMs);
    }
  }

  static async processScheduledCampaigns(): Promise<void> {
    const now = new Date();
    const due = await prisma.campaign.findMany({
      where: {
        status: 'SCHEDULED' as any,
        scheduledAt: { lte: now },
      },
      include: { steps: { where: { isActive: true }, orderBy: { stepOrder: 'asc' } } },
    });
    for (const c of due) {
      await prisma.campaign.update({
        where: { id: c.id },
        data: { status: 'ACTIVE' as any, startedAt: now },
      });
      if (c.steps.length > 0) {
        const dummyEvent: DomainEvent = {
          type: DomainEventType.CAMPAIGN_SCHEDULED,
          userId: '',
          payload: { campaignId: c.id, campaignName: c.name },
          metadata: { businessId: c.businessId, campaignId: c.id },
          timestamp: now,
        };
        await CampaignEngineService.executeFirstStep(c, dummyEvent);
      }
    }
  }

  static async processPendingSteps(): Promise<void> {
    const now = new Date();
    const pending = await prisma.campaignExecutionLog.findMany({
      where: { result: 'SCHEDULED' },
    });
    for (const log of pending) {
      const meta = log.metadata as Record<string, unknown> | null;
      if (!meta?.scheduledAt) continue;
      const scheduledAt = new Date(meta.scheduledAt as string);
      if (scheduledAt > now) continue;
      try {
        const step = {
          id: log.stepId || '',
          name: (meta.stepName as string) || '',
          actionType: meta.actionType as string,
          actionConfig: (meta.actionConfig as Record<string, unknown>) || {},
        };
        const campaign = await prisma.campaign.findUnique({
          where: { id: log.campaignId },
        });
        if (!campaign) {
          await prisma.campaignExecutionLog.update({
            where: { id: log.id },
            data: { result: 'FAILED', error: 'Campaign not found' },
          });
          continue;
        }
        const event: DomainEvent = {
          type: (meta.eventType as DomainEventType) || ('' as DomainEventType),
          userId: log.userId || '',
          payload: (meta.eventPayload as Record<string, unknown>) || {},
          metadata: { businessId: log.businessId || '', campaignId: log.campaignId },
          timestamp: now,
        };
        await CampaignEngineService.executeStepAction(step, campaign, event);
        await prisma.campaignExecutionLog.update({
          where: { id: log.id },
          data: { result: 'SUCCESS', executedAt: now },
        });
      } catch (err: any) {
        await prisma.campaignExecutionLog.update({
          where: { id: log.id },
          data: { result: 'FAILED', error: err.message },
        });
      }
    }
  }

  private static calculateDelayMs(step: any): number {
    let totalMs = 0;
    if (step.delayMinutes) totalMs += step.delayMinutes * 60 * 1000;
    if (step.delayHours) totalMs += step.delayHours * 3600 * 1000;
    if (step.delayDays) totalMs += step.delayDays * 86400 * 1000;
    return totalMs;
  }

  private static async executeStepWithDelay(
    step: any,
    campaign: any,
    event: DomainEvent
  ): Promise<void> {
    const delayMs = CampaignEngineService.calculateDelayMs(step);
    if (delayMs > 0) {
      const scheduledAt = new Date(Date.now() + delayMs);
      const log = await prisma.campaignExecutionLog.create({
        data: {
          campaignId: campaign.id,
          stepId: step.id,
          userId: event.userId,
          businessId: event.metadata?.businessId,
          result: 'SCHEDULED',
          metadata: {
            scheduledAt: scheduledAt.toISOString(),
            actionType: step.actionType,
            actionConfig: step.actionConfig,
            stepName: step.name,
            eventType: event.type,
            eventPayload: JSON.parse(JSON.stringify(event.payload)),
          } as any,
        },
      });
      setTimeout(async () => {
        try {
          await CampaignEngineService.executeStepAction(step, campaign, event);
          await prisma.campaignExecutionLog.update({
            where: { id: log.id },
            data: { result: 'SUCCESS' },
          });
        } catch (err: any) {
          await prisma.campaignExecutionLog.update({
            where: { id: log.id },
            data: { result: 'FAILED', error: err.message },
          });
        }
      }, delayMs);
    } else {
      await CampaignEngineService.executeStepAction(step, campaign, event);
    }
  }

  private static async executeStepAction(
    step: any,
    _campaign: any,
    event: DomainEvent
  ): Promise<void> {
    const cfg = step.actionConfig || {};
    const userId = event.userId;
    const bizId = event.metadata?.businessId;

    switch (step.actionType) {
      case 'SEND_NOTIFICATION':
        if (userId && cfg.title) {
          await prisma.notification.create({
            data: {
              userId,
              type: 'SYSTEM' as any,
              title: CampaignEngineService.interpolate(cfg.title, event),
              description: CampaignEngineService.interpolate(cfg.description || '', event),
              link: cfg.link || '',
              metadata: { source: 'campaign', stepId: step.id },
            },
          });
        }
        break;

      case 'APPLY_DISCOUNT':
        if (bizId && userId && cfg.percentage) {
          await prisma.coupon.create({
            data: {
              businessId: String(bizId),
              clientId: userId,
              code: 'CAMP-' + Date.now().toString(36).toUpperCase(),
              discountType: 'PERCENTAGE',
              discountValue: cfg.percentage,
              description: CampaignEngineService.interpolate(cfg.reason || 'Offre campagne', event),
              expiresAt: new Date(Date.now() + 30 * 86400000),
            } as any,
          });
        }
        break;

      case 'SEND_EMAIL': {
        const emailTo = event.metadata?.email || (event.payload?.email as string);
        if (emailTo && cfg.subject) {
          try {
            const { sendEmail } = await import('../lib/mail');
            const bodyHtml = `<p>${CampaignEngineService.interpolate(cfg.body || '', event)}</p>`;
            const htmlContent = `<html><body style="font-family:sans-serif;padding:20px">${bodyHtml}</body></html>`;
            await sendEmail(
              emailTo,
              CampaignEngineService.interpolate(cfg.subject, event),
              htmlContent
            );
          } catch (err) {
            logger.warn('CampaignEngine: EMAIL failed', { error: (err as Error).message });
          }
        } else {
          logger.info('CampaignEngine: EMAIL step', { userId, subject: cfg.subject });
        }
        break;
      }

      case 'SEND_SMS': {
        const smsTo = event.metadata?.phone || (event.payload?.phone as string);
        if (smsTo && cfg.body) {
          try {
            const { sendSMS } = await import('./NotificationChannels');
            await sendSMS({
              to: smsTo,
              message: CampaignEngineService.interpolate(cfg.body, event),
              businessName: event.metadata?.businessName,
            });
          } catch (err) {
            logger.warn('CampaignEngine: SMS failed', { error: (err as Error).message });
          }
        } else {
          logger.info('CampaignEngine: SMS step', { userId });
        }
        break;
      }

      case 'SEND_WHATSAPP': {
        const waTo = event.metadata?.phone || (event.payload?.phone as string);
        if (waTo && cfg.body) {
          try {
            const { sendWhatsApp } = await import('./NotificationChannels');
            await sendWhatsApp({
              to: waTo,
              message: CampaignEngineService.interpolate(cfg.body, event),
              businessName: event.metadata?.businessName,
            });
          } catch (err) {
            logger.warn('CampaignEngine: WhatsApp failed', { error: (err as Error).message });
          }
        } else {
          logger.info('CampaignEngine: WhatsApp step', { userId });
        }
        break;
      }

      case 'LOG_EVENT':
        logger.info('CampaignEngine: LOG', { step: step.name });
        break;

      default:
        logger.warn('CampaignEngine: action non supportee: ' + step.actionType);
    }
  }

  private static interpolate(t: string, event: DomainEvent): string {
    return t.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
      return String(event.payload?.[k] ?? (event.metadata as any)?.[k] ?? '');
    });
  }

  static stop(): void {
    if (CampaignEngineService.intervalId) {
      clearInterval(CampaignEngineService.intervalId);
      CampaignEngineService.intervalId = null;
    }
    CampaignEngineService.initialized = false;
    logger.info('CampaignEngineService: arrete');
  }
}
