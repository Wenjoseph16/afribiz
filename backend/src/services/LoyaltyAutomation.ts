import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { eventBus } from '../events/EventBus';
import { DomainEventType } from '../events/events';
import { publishLoyaltyPointsEarned, publishLoyaltyTierChanged } from '../events/publishers';

/**
 * LoyaltyAutomation — crédite automatiquement les points de fidélité
 *
 * S'abonne à ORDER_PLACED / PAYMENT_RECEIVED pour créditer des points
 * sur le programme de fidélité du business.
 */
export function registerLoyaltyAutomation(): void {
  eventBus.subscribe(DomainEventType.ORDER_PLACED, async (event) => {
    try {
      const businessId = event.metadata?.businessId;
      const clientId = event.userId;
      const amount = parseFloat(event.metadata?.amount || '0');
      if (!businessId || amount <= 0) return;

      await creditPoints(businessId, clientId, amount, `Commande #${event.metadata?.orderId?.substring(0, 8)}`);
    } catch (err) {
      logger.error('Loyalty: failed to credit order points', { error: err });
    }
  });

  eventBus.subscribe(DomainEventType.PAYMENT_RECEIVED, async (event) => {
    try {
      const businessId = event.metadata?.businessId;
      const clientId = event.userId;
      const amount = parseFloat(event.metadata?.amount || '0');
      if (!businessId || amount <= 0) return;

      await creditPoints(businessId, clientId, amount, `Paiement #${event.metadata?.paymentId?.substring(0, 8)}`);
    } catch (err) {
      logger.error('Loyalty: failed to credit payment points', { error: err });
    }
  });

  logger.info('LoyaltyAutomation: handlers registered');
}

async function creditPoints(businessId: string, clientId: string, amount: number, reason: string): Promise<void> {
  const program = await prisma.loyaltyProgram.findUnique({ where: { businessId } });
  if (!program || !program.isActive) return;

  const pointsPerAmount = program.pointsPerAmount || 10;
  const points = Math.floor(amount * pointsPerAmount);
  if (points <= 0) return;

  const lp = await prisma.loyaltyPoints.upsert({
    where: { businessId_clientId: { businessId, clientId } },
    create: { businessId, clientId, totalPoints: points },
    update: { totalPoints: { increment: points } },
  });

  await prisma.loyaltyTransaction.create({
    data: {
      loyaltyId: lp.id,
      type: 'EARNED',
      points,
      description: reason,
    },
  });

  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true, name: true } });
  if (!business) return;

  publishLoyaltyPointsEarned({
    userId: clientId,
    businessId,
    points,
    reason,
  });

  // Check tier change
  const newTier = determineTier(program, lp.totalPoints);
  if (newTier && newTier !== getCurrentTier(program, lp.totalPoints - points)) {
    publishLoyaltyTierChanged({
      userId: clientId,
      businessId,
      tier: newTier,
    });
  }
}

function determineTier(program: any, points: number): string {
  if (program.platinumMinPoints && points >= program.platinumMinPoints) return 'PLATINUM';
  if (program.goldMinPoints && points >= program.goldMinPoints) return 'GOLD';
  if (program.silverMinPoints && points >= program.silverMinPoints) return 'SILVER';
  if (program.bronzeMinPoints && points >= program.bronzeMinPoints) return 'BRONZE';
  return 'BRONZE';
}

function getCurrentTier(program: any, points: number): string {
  return determineTier(program, points);
}
