/**
 * Debts Data Layer
 * Pure database operations
 */
import { prisma } from '../lib/db';

export async function listDebts(
  businessId: string,
  opts?: { status?: string; limit?: number; offset?: number }
) {
  const where: any = { businessId };
  if (opts?.status) where.status = opts.status;
  return prisma.debt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts?.limit || 50,
    skip: opts?.offset || 0,
  });
}

export async function payDebt(debtId: string, amount: number) {
  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt) return null;
  const newPaid = Number(debt.amountPaid) + amount;
  return prisma.debt.update({
    where: { id: debtId },
    data: {
      amountPaid: newPaid,
      remainingAmount: Math.max(0, Number(debt.totalAmount) - newPaid),
      status: newPaid >= Number(debt.totalAmount) ? 'SETTLED' : 'PARTIALLY_PAID',
    },
  });
}

export async function settleDebt(debtId: string) {
  return prisma.debt.update({
    where: { id: debtId },
    data: {
      amountPaid:
        (await prisma.debt.findUnique({ where: { id: debtId }, select: { totalAmount: true } }))
          ?.totalAmount || 0,
      remainingAmount: 0,
      status: 'SETTLED',
    },
  });
}
