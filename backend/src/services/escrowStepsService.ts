import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { publishEscrowCreated, publishEscrowReleased } from '../events/publishers';
import { getOrCreateWallet } from './wallet';
import { calculateCommission } from './monetizationConfig';

export async function createStepEscrow(data: {
  businessId: string;
  orderId?: string;
  amount: number;
  currency?: string;
  totalSteps: number;
  stepDescriptions: string[];
  notes?: string;
}) {
  const { rate, commission: fee, netAmount } = await calculateCommission(data.amount, 'escrow');

  const escrow = await prisma.escrow.create({
    data: {
      businessId: data.businessId,
      orderId: data.orderId || null,
      amount: data.amount,
      currency: data.currency || 'FCFA',
      status: 'HELD',
      fee,
      feeRate: rate,
      netAmount,
      notes: JSON.stringify({
        type: 'STEPPED',
        totalSteps: data.totalSteps,
        currentStep: 0,
        fee,
        netAmount,
        steps: data.stepDescriptions.map((desc, i) => ({
          step: i + 1,
          description: desc,
          status: 'PENDING',
          releasedAt: null,
          amount: i === data.totalSteps - 1
            ? (data.amount - Math.floor(data.amount / data.totalSteps) * (data.totalSteps - 1))
            : Math.floor((data.amount / data.totalSteps) * 100) / 100,
        })),
      }),
    },
  });

  // Log the commission
  try {
    await prisma.financialLog.create({
      data: {
        businessId: data.businessId,
        action: 'MANUAL_ADJUSTMENT',
        amount: -fee,
        description: `Commission AfriBiz 2% sur escrow par étapes de ${data.amount} FCFA`,
        metadata: { commissionType: 'ESCROW_FEE', escrowId: escrow.id, amount: data.amount, fee, feeRate: rate, netAmount },
      },
    });
  } catch (e) {
    logger.error('Failed to log escrow step commission', { error: e });
  }

  publishEscrowCreated({
    userId: data.businessId,
    escrowId: escrow.id,
    amount: String(escrow.amount),
    orderId: data.orderId,
  });

  return escrow;
}

export async function releaseStep(escrowId: string, businessId: string, stepNumber: number) {
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, businessId },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);
  if (escrow.status !== 'HELD') throw new AppError('Escrow non actif', 400);

  const notes = typeof escrow.notes === 'string' ? JSON.parse(escrow.notes) : escrow.notes;
  if (!notes || notes.type !== 'STEPPED') throw new AppError('Escrow non configuré par étapes', 400);

  const step = notes.steps.find((s: any) => s.step === stepNumber);
  if (!step) throw new AppError('Étape ' + stepNumber + ' introuvable', 404);
  if (step.status === 'RELEASED') throw new AppError('Étape déjà libérée', 400);

  const previousStepsReleased = notes.steps
    .filter((s: any) => s.step < stepNumber)
    .every((s: any) => s.status === 'RELEASED');
  if (!previousStepsReleased) {
    throw new AppError('Les étapes précédentes doivent être libérées d\'abord', 400);
  }

  step.status = 'RELEASED';
  step.releasedAt = new Date().toISOString();
  notes.currentStep = stepNumber;

  const allReleased = notes.steps.every((s: any) => s.status === 'RELEASED');
  const upd: any = {
    notes: JSON.stringify(notes),
  };

  if (allReleased) {
    upd.status = 'RELEASED';
    upd.releasedAt = new Date();
    // Credit wallet with net amount
    try {
      await getOrCreateWallet(escrow.businessId);
      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { businessId: escrow.businessId } });
        if (wallet) {
          const escrowFee = Number(escrow.fee || 0);
          const netAmount = Number(escrow.amount) - escrowFee;
          const newBalance = Number(wallet.balance) + netAmount;
          await tx.wallet.update({ where: { businessId: escrow.businessId }, data: { balance: newBalance } });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'ESCROW_RELEASE',
              amount: netAmount,
              balanceBefore: Number(wallet.balance),
              balanceAfter: newBalance,
              reference: escrowId,
              description: `Libération escrow par étapes (${escrowFee} FCFA de frais déduits)`,
            },
          });
        }
      });
    } catch (e) {
      logger.error('Failed to credit wallet on stepped escrow release', { error: e });
    }
  }

  const updated = await prisma.escrow.update({
    where: { id: escrowId },
    data: upd,
  });

  if (allReleased) {
    publishEscrowReleased({
      userId: businessId,
      escrowId,
      amount: String(escrow.amount),
    });
  }

  return updated;
}

export async function getStepProgress(escrowId: string, businessId: string) {
  const escrow = await prisma.escrow.findFirst({
    where: { id: escrowId, businessId },
  });
  if (!escrow) throw new AppError('Escrow non trouvé', 404);

  const notes = typeof escrow.notes === 'string' ? JSON.parse(escrow.notes) : escrow.notes;
  if (!notes || notes.type !== 'STEPPED') {
    return { type: 'STANDARD', status: escrow.status, amount: Number(escrow.amount) };
  }

  const releasedSteps = notes.steps.filter((s: any) => s.status === 'RELEASED').length;
  const totalReleased = notes.steps
    .filter((s: any) => s.status === 'RELEASED')
    .reduce((sum: number, s: any) => sum + s.amount, 0);

  return {
    type: 'STEPPED',
    status: escrow.status,
    totalSteps: notes.totalSteps,
    currentStep: notes.currentStep,
    steps: notes.steps,
    progress: Math.round((releasedSteps / notes.totalSteps) * 100),
    totalReleased,
    totalAmount: Number(escrow.amount),
  };
}
