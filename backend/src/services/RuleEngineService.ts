import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { eventBus } from '../events/EventBus';
import { DomainEvent, DomainEventType } from '../events/events';

const EVENT_TO_TRIGGER: Record<string, string> = {
  [DomainEventType.ORDER_PLACED]: 'ORDER_PLACED',
  [DomainEventType.ORDER_CONFIRMED]: 'ORDER_CONFIRMED',
  [DomainEventType.ORDER_CANCELLED]: 'ORDER_CANCELLED',
  [DomainEventType.BOOKING_CREATED]: 'BOOKING_MADE',
  [DomainEventType.BOOKING_CONFIRMED]: 'BOOKING_CONFIRMED',
  [DomainEventType.BOOKING_CANCELLED]: 'BOOKING_CANCELLED',
  [DomainEventType.BOOKING_REMINDER]: 'BOOKING_REMINDER',
  [DomainEventType.PAYMENT_RECEIVED]: 'PAYMENT_RECEIVED',
  [DomainEventType.PAYMENT_FAILED]: 'PAYMENT_FAILED',
  [DomainEventType.PAYMENT_REFUNDED]: 'PAYMENT_REFUNDED',
  [DomainEventType.REVIEW_PUBLISHED]: 'REVIEW_PUBLISHED',
  [DomainEventType.LOW_STOCK]: 'STOCK_LOW',
  [DomainEventType.OUT_OF_STOCK]: 'STOCK_OUT',
  [DomainEventType.BACK_IN_STOCK]: 'STOCK_BACK_IN',
  [DomainEventType.CLIENT_INACTIVE]: 'CLIENT_INACTIVE',
  [DomainEventType.NEW_CLIENT]: 'NEW_CLIENT',
  [DomainEventType.SUBSCRIPTION_EXPIRING]: 'SUBSCRIPTION_EXPIRING',
  [DomainEventType.MODULE_INSTALLED]: 'MODULE_INSTALLED',
  [DomainEventType.MODULE_UNINSTALLED]: 'MODULE_UNINSTALLED',
  [DomainEventType.SCORE_RECALCULATED]: 'SCORE_CHANGED',
  [DomainEventType.BADGE_EARNED]: 'BADGE_EARNED',
  [DomainEventType.DEBT_OVERDUE]: 'DEBT_OVERDUE',
  [DomainEventType.DISPUTE_OPENED]: 'DISPUTE_OPENED',
  [DomainEventType.AD_COMPLETED]: 'AD_COMPLETED',
  // Couverture élargie : ces événements déclenchent aussi des règles existantes.
  // Les triggers sont une colonne enum (AutomationTrigger) : chaque mapping
  // pointe vers une valeur valide de l'enum pour que les règles se déclenchent.
  [DomainEventType.USER_SIGNED_UP]: 'NEW_CLIENT',
  [DomainEventType.ORDER_ACCEPTED]: 'ORDER_CONFIRMED',
  [DomainEventType.ORDER_REFUSED]: 'ORDER_CANCELLED',
  [DomainEventType.INVOICE_PAID]: 'PAYMENT_RECEIVED',
  [DomainEventType.UPCOMING_EVENT]: 'EVENT_SCHEDULED',
};

export class RuleEngineService {
  private static initialized = false;

  static start(): void {
    if (RuleEngineService.initialized) return;
    RuleEngineService.initialized = true;
    logger.info('RuleEngineService: demarrage');
    eventBus.subscribeToAll(async (event: DomainEvent) => {
      await RuleEngineService.processEvent(event);
    });
    logger.info('RuleEngineService: demarre avec succes');
  }

  static async processEvent(event: DomainEvent): Promise<void> {
    const trigger = EVENT_TO_TRIGGER[event.type];
    if (!trigger) return;
    try {
      const rules = await prisma.automationRule.findMany({
        where: { trigger: trigger as any, status: 'ACTIVE' },
      });
      if (rules.length === 0) return;
      for (const rule of rules) {
        await RuleEngineService.evaluateAndExecute(rule, event);
      }
    } catch (err) {
      logger.error('RuleEngine: erreur traitement event', { error: err });
    }
  }

  private static getValue(event: DomainEvent, c: any): any {
    return event.payload?.[c.field] ?? (event.metadata as any)?.[c.field];
  }

  private static evaluateSingleCondition(c: any, event: DomainEvent): boolean {
    let val = RuleEngineService.getValue(event, c);
    if (val === undefined) {
      val = (event as any)[c.field];
    }

    // NOT operator support
    const applyNot = c.not === true;
    let result: boolean;

    switch (c.operator) {
      case 'eq':
        result = val == c.value;
        break;
      case 'neq':
        result = val != c.value;
        break;
      case 'gt':
        result = Number(val) > Number(c.value);
        break;
      case 'gte':
        result = Number(val) >= Number(c.value);
        break;
      case 'lt':
        result = Number(val) < Number(c.value);
        break;
      case 'lte':
        result = Number(val) <= Number(c.value);
        break;
      case 'contains':
        result = String(val).includes(String(c.value));
        break;
      case 'startsWith':
        result = String(val).startsWith(String(c.value));
        break;
      case 'endsWith':
        result = String(val).endsWith(String(c.value));
        break;
      case 'in':
        result = Array.isArray(c.value) && c.value.includes(val);
        break;
      case 'notIn':
        result = Array.isArray(c.value) && !c.value.includes(val);
        break;
      case 'exists':
        result = val !== undefined && val !== null;
        break;
      case 'regex':
        try {
          result = new RegExp(String(c.value)).test(String(val));
        } catch {
          result = false;
        }
        break;
      default:
        result = true;
    }

    return applyNot ? !result : result;
  }

  private static evaluateConditions(conditions: any, event: DomainEvent): boolean {
    if (!conditions || (Array.isArray(conditions) && conditions.length === 0)) return true;

    const condData = Array.isArray(conditions) ? { conditions, logic: 'AND' } : conditions;
    const logic = condData.logic || 'AND';
    const items = condData.conditions || conditions;
    const not = condData.not === true;

    if (logic === 'OR') {
      // Group OR: au moins une condition vraie
      const result = items.some((c: any) => {
        if (c.conditions) {
          return RuleEngineService.evaluateConditions(c, event);
        }
        return RuleEngineService.evaluateSingleCondition(c, event);
      });
      return not ? !result : result;
    } else {
      // AND (default): toutes les conditions vraies
      // Support AND/OR/NOT avec groupes imbriqués
      const result = items.every((c: any) => {
        if (c.conditions) {
          // Groupe imbriqué (sous-conditions)
          return RuleEngineService.evaluateConditions(c, event);
        }
        return RuleEngineService.evaluateSingleCondition(c, event);
      });
      return not ? !result : result;
    }
  }

  private static async evaluateAndExecute(rule: any, event: DomainEvent): Promise<void> {
    try {
      if (rule.cooldownMinutes && rule.cooldownMinutes > 0 && rule.lastExecutedAt) {
        const cd = new Date(rule.lastExecutedAt.getTime() + rule.cooldownMinutes * 60000);
        if (new Date() < cd) return;
      }

      if (!RuleEngineService.evaluateConditions(rule.conditions, event)) return;

      await RuleEngineService.executeAction(rule, event);
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: { executionCount: { increment: 1 }, lastExecutedAt: new Date() },
      });
      await prisma.automationExecutionLog.create({
        data: {
          ruleId: rule.id,
          trigger: rule.trigger,
          triggerData: event.payload as any,
          result: 'SUCCESS',
        },
      });
      logger.info('RuleEngine: regle "' + rule.name + '" executee');
    } catch (err: any) {
      await prisma.automationExecutionLog
        .create({
          data: {
            ruleId: rule.id,
            trigger: rule.trigger,
            triggerData: event.payload as any,
            result: 'FAILED',
            error: err.message,
          },
        })
        .catch(() => {});
      logger.error('RuleEngine: regle "' + rule.name + '" echouee', { error: err.message });
    }
  }

  private static interpolateString(t: string, event: DomainEvent): string {
    return t.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      return String(event.payload?.[k] ?? (event.metadata as any)?.[k] ?? '');
    });
  }

  private static async executeAction(rule: any, event: DomainEvent): Promise<void> {
    const { actionType, actionConfig } = rule;
    const cfg = actionConfig || {};
    const interp = (t: string) => RuleEngineService.interpolateString(t, event);

    switch (actionType) {
      case 'SEND_NOTIFICATION':
        await RuleEngineService.createAndSendNotification(
          event.userId,
          interp(cfg.title || 'Notification'),
          interp(cfg.description || ''),
          cfg.link
        );
        break;

      case 'SEND_EMAIL': {
        const emailTo = event.metadata?.email || (event.payload?.email as string);
        if (emailTo && cfg.subject) {
          try {
            const { sendEmail } = await import('../lib/mail');
            const bodyHtml = `<p>${interp(cfg.body || '')}</p>`;
            const htmlContent = `<html><body style="font-family:sans-serif;padding:20px">${bodyHtml}</body></html>`;
            await sendEmail(emailTo, interp(cfg.subject), htmlContent);
          } catch (err) {
            logger.warn('RuleEngine: EMAIL failed', { error: (err as Error).message });
          }
        } else {
          logger.info('RuleEngine: EMAIL -> ' + event.userId + ': ' + (cfg.subject || ''));
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
              message: interp(cfg.body),
              businessName: event.metadata?.businessName,
            });
          } catch (err) {
            logger.warn('RuleEngine: SMS failed', { error: (err as Error).message });
          }
        } else {
          logger.info('RuleEngine: SMS -> ' + event.userId);
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
              message: interp(cfg.body),
              businessName: event.metadata?.businessName,
            });
          } catch (err) {
            logger.warn('RuleEngine: WhatsApp failed', { error: (err as Error).message });
          }
        } else {
          logger.info('RuleEngine: WhatsApp -> ' + event.userId);
        }
        break;
      }

      case 'CREATE_TASK': {
        const bizId = event.metadata?.businessId;
        if (bizId && cfg.title) {
          await prisma.planningTask.create({
            data: {
              businessId: String(bizId),
              title: interp(cfg.title),
              description: interp(cfg.description || ''),
              priority: (cfg.priority || 'MEDIUM') as any,
              status: 'TODO' as any,
              dueDate: cfg.dueDate ? new Date(interp(cfg.dueDate)) : undefined,
              assigneeId: cfg.assigneeId || undefined,
            },
          });
        }
        break;
      }

      case 'APPLY_DISCOUNT': {
        const bid = event.metadata?.businessId;
        if (!bid) {
          logger.warn('RuleEngine: APPLY_DISCOUNT skipped - no businessId');
          break;
        }
        const code = 'AUTO-' + Date.now().toString(36).toUpperCase();
        const pct = cfg.percentage || cfg.fixedAmount || 10;
        await prisma.coupon.create({
          data: {
            businessId: String(bid),
            clientId: event.userId,
            code,
            discountType: 'PERCENTAGE',
            discountValue: pct,
            description: interp(cfg.reason || 'Reduction automatique'),
            expiresAt: new Date(Date.now() + 30 * 86400000),
          } as any,
        });
        break;
      }

      case 'UPDATE_SCORE': {
        if (event.metadata?.businessId) {
          const bid = String(event.metadata.businessId);
          const score = await prisma.businessScore.findUnique({ where: { businessId: bid } });
          if (score) {
            await prisma.businessScore.update({
              where: { businessId: bid },
              data: {
                overallScore: Math.max(
                  0,
                  Math.min(1000, (score.overallScore || 0) + (cfg.delta || 0))
                ),
              },
            });
          }
        }
        break;
      }

      // ═══ Nouvelle action: CREDIT_LOYALTY_POINTS ═══
      case 'CREDIT_LOYALTY_POINTS': {
        if (event.metadata?.businessId) {
          const pts = cfg.points || 10;
          const existing = await prisma.loyaltyPoints.findFirst({
            where: { clientId: event.userId, businessId: String(event.metadata.businessId) },
          });
          if (existing) {
            await prisma.loyaltyPoints.update({
              where: { id: existing.id },
              data: { totalPoints: { increment: pts } },
            });
          }
        }
        break;
      }

      // ═══ Nouvelle action: ADJUST_PRICE ═══
      case 'ADJUST_PRICE': {
        const { productId, adjustType, adjustValue } = cfg;
        if (productId && adjustType && adjustValue) {
          const product = await prisma.product.findUnique({ where: { id: productId } });
          if (product) {
            const current = Number(product.price);
            const newPrice =
              adjustType === 'percentage'
                ? current * (1 + adjustValue / 100)
                : current + adjustValue;
            await prisma.product.update({
              where: { id: productId },
              data: { price: Math.max(0, newPrice) },
            });
          }
        }
        break;
      }

      // ═══ Nouvelle action: TRIGGER_CAMPAIGN ═══
      case 'TRIGGER_CAMPAIGN': {
        const { campaignName, channel } = cfg;
        if (campaignName && event.metadata?.businessId) {
          // Log campaign trigger (real campaign execution uses CampaignEngine)
          logger.info('RuleEngine: CAMPAIGN "' + campaignName + '" triggered for ' + event.userId, {
            channel,
            businessId: event.metadata?.businessId,
          });
        }
        break;
      }

      // ═══ Nouvelle action: CREATE_ALERT ═══
      case 'CREATE_ALERT': {
        const alertBizId = event.metadata?.businessId;
        if (alertBizId && cfg.message) {
          await prisma.notification.create({
            data: {
              userId: event.userId,
              type: 'SYSTEM' as any,
              title: interp(cfg.title || 'Alerte'),
              description: interp(cfg.message),
              link: cfg.link || '',
              metadata: { source: 'rule_engine_alert', severity: cfg.severity || 'info' },
            },
          });
        }
        break;
      }

      case 'CALL_WEBHOOK': {
        if (cfg.url) {
          const url = interp(cfg.url);
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Event-Type': event.type },
            body: JSON.stringify({
              event: event.type,
              userId: event.userId,
              payload: event.payload,
            }),
          }).catch((e: Error) =>
            logger.warn('RuleEngine: webhook failed', { url, error: e.message })
          );
        }
        break;
      }

      case 'BLOCK_USER':
        await prisma.user.update({ where: { id: event.userId }, data: { isActive: false } });
        break;

      case 'LOG_EVENT':
        logger.info('RuleEngine: LOG', { rule: rule.name, event: event.type });
        break;

      case 'ASSIGN_TAG': {
        const tagBizId = event.metadata?.businessId;
        if (tagBizId && cfg.tagName && event.userId) {
          try {
            const tag = await prisma.businessTag.findFirst({
              where: { businessId: String(tagBizId), name: interp(cfg.tagName) },
            });
            if (tag) {
              const client = await prisma.businessClient.findFirst({
                where: { businessId: String(tagBizId), clientId: event.userId },
              });
              if (client) {
                await prisma.businessClientTag.upsert({
                  where: { clientId_tagId: { clientId: client.id, tagId: tag.id } },
                  create: { clientId: client.id, tagId: tag.id },
                  update: {},
                });
              }
            }
          } catch (err) {
            logger.warn('RuleEngine: ASSIGN_TAG failed', { error: (err as Error).message });
          }
        } else {
          logger.warn('RuleEngine: ASSIGN_TAG skipped - missing businessId/tagName/userId');
        }
        break;
      }

      case 'UPDATE_STATUS': {
        const statusBizId = event.metadata?.businessId;
        if (statusBizId && cfg.targetType && cfg.targetId && cfg.status) {
          try {
            const targetType = cfg.targetType as string;
            const targetId = interp(cfg.targetId);
            const newStatus = cfg.status as string;
            switch (targetType) {
              case 'ORDER':
                await prisma.order.update({
                  where: { id: targetId },
                  data: { status: newStatus as any },
                });
                break;
              case 'BOOKING':
                await prisma.booking.update({
                  where: { id: targetId },
                  data: { status: newStatus as any },
                });
                break;
              case 'DEAL':
                if (cfg.stageId) {
                  await prisma.deal.update({
                    where: { id: targetId },
                    data: { stageId: cfg.stageId },
                  });
                }
                break;
              default:
                logger.warn('RuleEngine: UPDATE_STATUS unknown targetType: ' + targetType);
            }
          } catch (err) {
            logger.warn('RuleEngine: UPDATE_STATUS failed', { error: (err as Error).message });
          }
        } else {
          logger.warn('RuleEngine: UPDATE_STATUS skipped - missing params');
        }
        break;
      }

      case 'SUSPEND_BUSINESS':
        if (event.metadata?.businessId) {
          await prisma.business.update({
            where: { id: String(event.metadata.businessId) },
            data: { isActive: false },
          });
        }
        break;

      default:
        logger.warn('RuleEngine: action inconnue: ' + actionType);
    }
  }

  private static async createAndSendNotification(
    userId: string,
    title: string,
    description: string,
    link?: string
  ): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM' as any,
          title,
          description,
          link: link || '',
          metadata: { source: 'rule_engine' },
        },
      });
    } catch (err) {
      logger.warn('RuleEngine: echec creation notification', { error: err });
    }
  }
}
