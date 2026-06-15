import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { publishCommissionCharged } from '../events/publishers';
import { calculateCommission } from './monetizationConfig';

const PAYMENT_METHOD_ORDER = [
  'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'ESCROW'
];

export async function getHybridPayments(orderId: string) {
  const [payments, order] = await Promise.all([
    prisma.payment.findMany({
      where: { orderId },
      include: { proofs: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.findUnique({
      where: { id: orderId },
      select: { totalAmount: true },
    }),
  ]);

  const totalPaid = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const methods = payments.map(p => ({
    method: p.method,
    amount: Number(p.amount),
    status: p.status,
    reference: p.reference,
    paidAt: p.paidAt,
    isManual: p.isManual,
    hasProof: p.proofs.length > 0,
  }));

  return {
    payments,
    methods,
    totalPaid,
    orderTotal: order ? Number(order.totalAmount) : 0,
    paymentCount: payments.length,
    isFullyPaid: order ? totalPaid >= Number(order.totalAmount) : false,
  };
}

export async function addHybridPayment(data: {
  orderId: string;
  userId: string;
  businessId: string;
  amount: number;
  method: string;
  reference?: string;
  isManual?: boolean;
  proofUrl?: string;
  notes?: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: data.orderId } });
  if (!order) throw new AppError('Commande non trouvée', 404);

  const existingPayments = await prisma.payment.findMany({
    where: { orderId: data.orderId, status: { in: ['COMPLETED', 'VERIFYING'] } },
  });
  const alreadyPaid = existingPayments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Number(order.totalAmount) - alreadyPaid;

  if (data.amount > remaining) {
    throw new AppError('Le montant dépasse le reste dû (' + remaining + ')', 400);
  }

  const payment = await prisma.payment.create({
    data: {
      userId: data.userId,
      orderId: data.orderId,
      amount: data.amount,
      method: data.method as any,
      status: data.isManual ? 'VERIFYING' : 'COMPLETED',
      reference: data.reference || null,
      isManual: data.isManual || false,
      description: data.notes || ('Paiement hybride - ' + data.method),
      paidAt: data.isManual ? null : new Date(),
    },
  });

  if (data.proofUrl) {
    await prisma.paymentProof.create({
      data: { paymentId: payment.id, imageUrl: data.proofUrl, notes: data.notes },
    });
  }

  const nowTotalPaid = alreadyPaid + data.amount;
  if (nowTotalPaid >= Number(order.totalAmount)) {
    await prisma.order.update({
      where: { id: data.orderId },
      data: { status: 'CONFIRMED', paidAt: new Date() },
    });
  }

  const { rate: commissionRate, commission: platformCommission } = await calculateCommission(data.amount, 'transaction');

  await prisma.financialLog.create({
    data: {
      businessId: data.businessId,
      userId: data.userId,
      action: 'PAYMENT_RECEIVED',
      amount: data.amount,
      description: 'Paiement hybride (' + data.method + ') sur commande #' + data.orderId.slice(0, 8),
      metadata: { orderId: data.orderId, paymentId: payment.id, method: data.method, isPartial: nowTotalPaid < Number(order.totalAmount) },
    },
  });

  // Log platform commission
  if (platformCommission > 0 && !data.isManual) {
    try {
      await prisma.financialLog.create({
        data: {
          businessId: data.businessId,
          userId: data.userId,
          action: 'MANUAL_ADJUSTMENT',
          amount: -platformCommission,
          description: 'Commission AfriBiz ' + (commissionRate * 100).toFixed(1) + '% sur paiement hybride (' + data.method + ') de ' + data.amount + ' FCFA',
          metadata: { commissionType: 'TRANSACTION_FEE', paymentId: payment.id, orderId: data.orderId, method: data.method, paymentAmount: data.amount, commissionRate },
        },
      });

      publishCommissionCharged({
        userId: data.userId,
        amount: String(platformCommission),
        businessName: 'AfriBiz',
        businessId: data.businessId,
      });
    } catch (e) {
      logger.error('Failed to log hybrid payment commission', { error: e });
    }
  }

  return payment;
}

export async function verifyHybridPayment(ownerId: string, paymentId: string, verified: boolean, notes?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) throw new AppError('Paiement non trouvé', 404);
  if (payment.status !== 'VERIFYING') throw new AppError('Paiement pas en attente de vérification', 400);

  if (verified) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED', paidAt: new Date(), verifiedBy: ownerId, verifiedAt: new Date(), verificationNotes: notes || null },
    });

    // Charger la commission sur le paiement manuel vérifié
    const { rate: commissionRate, commission: platformCommission } = await calculateCommission(Number(payment.amount), 'transaction');
    if (platformCommission > 0) {
      try {
        const orderBiz = payment.orderId
          ? await prisma.order.findUnique({ where: { id: payment.orderId }, select: { businessId: true } })
          : null;
        const bizId = orderBiz?.businessId || ownerId;
        await prisma.financialLog.create({
          data: {
            businessId: bizId,
            userId: payment.userId,
            action: 'MANUAL_ADJUSTMENT',
            amount: -platformCommission,
            description: `Commission AfriBiz ${(commissionRate * 100).toFixed(1)}% sur paiement manuel vérifié de ${payment.amount} FCFA`,
            metadata: { commissionType: 'VERIFIED_PAYMENT_FEE', paymentId, paymentAmount: Number(payment.amount), commissionRate },
          },
        });
        publishCommissionCharged({
          userId: payment.userId,
          amount: String(platformCommission),
          businessName: 'AfriBiz',
          businessId: bizId,
        });
      } catch (e) {
        logger.error('Failed to log commission on verified payment', { error: e });
      }
    }

    if (payment.order) {
      const allPayments = await prisma.payment.findMany({ where: { orderId: payment.orderId, status: 'COMPLETED' } });
      const totalPaid = allPayments.reduce((s, p) => s + Number(p.amount), 0);
      if (totalPaid >= Number(payment.order.totalAmount)) {
        await prisma.order.update({ where: { id: payment.orderId! }, data: { status: 'CONFIRMED', paidAt: new Date() } });
      }
    }
  } else {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED', verificationNotes: notes || 'Rejeté' },
    });
  }

  return payment;
}
