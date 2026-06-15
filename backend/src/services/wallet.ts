import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function getOrCreateWallet(businessId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { businessId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { businessId, balance: 0, locked: 0, currency: 'FCFA' },
    });
  }
  return wallet;
}

export async function getBalance(businessId: string) {
  const wallet = await getOrCreateWallet(businessId);
  return { balance: Number(wallet.balance), locked: Number(wallet.locked), available: Number(wallet.balance) - Number(wallet.locked), currency: wallet.currency };
}

export async function deposit(businessId: string, data: { amount: number; reference?: string; description?: string }) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { businessId } });
    if (!wallet) throw new AppError('Wallet non trouvé', 404);
    const newBalance = Number(wallet.balance) + data.amount;
    await tx.wallet.update({ where: { businessId }, data: { balance: newBalance } });
    return tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: data.amount,
        balanceBefore: Number(wallet.balance),
        balanceAfter: newBalance,
        reference: data.reference,
        description: data.description || 'Dépôt',
      },
    });
  });
}

export async function withdraw(businessId: string, data: { amount: number; reference?: string; description?: string }) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { businessId } });
    if (!wallet) throw new AppError('Wallet non trouvé', 404);
    const available = Number(wallet.balance) - Number(wallet.locked);
    if (data.amount > available) throw new AppError('Solde insuffisant', 400);
    const newBalance = Number(wallet.balance) - data.amount;
    await tx.wallet.update({ where: { businessId }, data: { balance: newBalance } });
    return tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: -data.amount,
        balanceBefore: Number(wallet.balance),
        balanceAfter: newBalance,
        reference: data.reference,
        description: data.description || 'Retrait',
      },
    });
  });
}

export async function listTransactions(businessId: string, filters: { page?: number; limit?: number; type?: string }) {
  const wallet = await getOrCreateWallet(businessId);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const where: Prisma.WalletTransactionWhereInput = { walletId: wallet.id };
  if (filters.type) where.type = filters.type;
  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.walletTransaction.count({ where }),
  ]);
  return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
}
