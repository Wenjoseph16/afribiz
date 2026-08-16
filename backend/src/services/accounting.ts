import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { addMovement, normalizeCashMethod } from './cashService';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findFirst({
      where: { ownerId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business;
}

export const EXPENSE_CATEGORIES = [
  'ACHATS',
  'LOYER',
  'SALAIRES',
  'CHARGES',
  'TRANSPORT',
  'COMMUNICATION',
  'MARKETING',
  'MAINTENANCE',
  'ASSURANCE',
  'FISCALITE',
  'BANCAIRE',
  'FORMATION',
  'EQUIPEMENT',
  'MATIERES_PREMIERES',
  'SERVICES_EXTERNES',
  'AUTRE',
] as const;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  ACHATS: 'Achats',
  LOYER: 'Loyer',
  SALAIRES: 'Salaires',
  CHARGES: 'Charges',
  TRANSPORT: 'Transport',
  COMMUNICATION: 'Communication',
  MARKETING: 'Marketing & Publicité',
  MAINTENANCE: 'Maintenance',
  ASSURANCE: 'Assurance',
  FISCALITE: 'Fiscalité & Taxes',
  BANCAIRE: 'Frais bancaires',
  FORMATION: 'Formation',
  EQUIPEMENT: 'Équipement',
  MATIERES_PREMIERES: 'Matières premières',
  SERVICES_EXTERNES: 'Services externes',
  AUTRE: 'Autre',
};

export async function listExpenses(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, category, dateFrom, dateTo, search } = filters;
  const where: any = { businessId: business.id };
  if (category) where.category = category;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search) where.description = { contains: search, mode: 'insensitive' };
  const skip = (page - 1) * limit;
  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.expense.count({ where }),
  ]);
  return { expenses, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getExpense(ownerId: string, expenseId: string) {
  const business = await getBusinessByOwner(ownerId);
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, businessId: business.id },
  });
  if (!expense) throw new AppError('Dépense non trouvée', 404);
  return expense;
}

export async function createExpense(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const expense = await prisma.expense.create({
    data: {
      businessId: business.id,
      description: data.description,
      amount: Number(data.amount),
      category: data.category || 'AUTRE',
      date: data.date ? new Date(data.date) : new Date(),
      paymentMethod: data.paymentMethod || null,
      reference: data.reference || null,
      notes: data.notes || null,
      isRecurring: data.isRecurring || false,
      recurringFrequency: data.recurringFrequency || null,
      attachments: data.attachments || [],
      taxDeductible: data.taxDeductible || false,
    },
  });

  // Caisse du jour (Chantier 4) : chaque sortie d'argent est tracée dans la caisse
  addMovement(
    ownerId,
    {
      type: 'EXPENSE',
      amount: Number(data.amount),
      method: normalizeCashMethod(data.paymentMethod),
      label: 'Sortie de caisse',
      description: `${data.description || 'Dépense'}${data.reference ? ` (${data.reference})` : ''}`,
      sourceType: 'EXPENSE',
      sourceId: expense.id,
    },
    ownerId
  ).catch((e: any) => logger.warn(`Caisse: mouvement EXPENSE non créé: ${e?.message || e}`));

  return expense;
}

export async function updateExpense(ownerId: string, expenseId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.expense.findFirst({
    where: { id: expenseId, businessId: business.id },
  });
  if (!existing) throw new AppError('Dépense non trouvée', 404);
  const upd: any = {};
  if (data.description !== undefined) upd.description = data.description;
  if (data.amount !== undefined) upd.amount = Number(data.amount);
  if (data.category !== undefined) upd.category = data.category;
  if (data.date !== undefined) upd.date = new Date(data.date);
  if (data.paymentMethod !== undefined) upd.paymentMethod = data.paymentMethod;
  if (data.reference !== undefined) upd.reference = data.reference;
  if (data.notes !== undefined) upd.notes = data.notes;
  if (data.isRecurring !== undefined) upd.isRecurring = data.isRecurring;
  if (data.recurringFrequency !== undefined) upd.recurringFrequency = data.recurringFrequency;
  if (data.attachments !== undefined) upd.attachments = data.attachments;
  if (data.taxDeductible !== undefined) upd.taxDeductible = data.taxDeductible;
  return prisma.expense.update({ where: { id: expenseId }, data: upd });
}

export async function deleteExpense(ownerId: string, expenseId: string) {
  const business = await getBusinessByOwner(ownerId);
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, businessId: business.id },
  });
  if (!expense) throw new AppError('Dépense non trouvée', 404);
  await prisma.expense.delete({ where: { id: expenseId } });
  return { deleted: true };
}

export async function getAccountingStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const [
    totalExpenses,
    monthExpenses,
    yearExpenses,
    categoryBreakdown,
    expenseCount,
    monthRevenue,
  ] = await Promise.all([
    prisma.expense.aggregate({ where: { businessId: business.id }, _sum: { amount: true } }),
    prisma.expense.aggregate({
      where: { businessId: business.id, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { businessId: business.id, date: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { businessId: business.id },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.expense.count({ where: { businessId: business.id } }),
    prisma.order.aggregate({
      where: { businessId: business.id, paidAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
  ]);
  return {
    totalExpenses: totalExpenses._sum.amount || 0,
    monthExpenses: monthExpenses._sum.amount || 0,
    yearExpenses: yearExpenses._sum.amount || 0,
    totalExpenseCount: expenseCount,
    monthRevenue: monthRevenue._sum.totalAmount || 0,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category,
      label: EXPENSE_CATEGORY_LABELS[c.category] || c.category,
      total: c._sum.amount || 0,
      count: c._count,
    })),
  };
}

export async function getMonthlyReport(ownerId: string, year: number, month: number) {
  const business = await getBusinessByOwner(ownerId);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  const [expenses, revenue, expenseByCategory] = await Promise.all([
    prisma.expense.aggregate({
      where: { businessId: business.id, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: { businessId: business.id, paidAt: { gte: startDate, lte: endDate } },
      _sum: { totalAmount: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { businessId: business.id, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
  ]);
  const totalRevenue = revenue._sum.totalAmount || 0;
  const totalExpenses = expenses._sum.amount || 0;
  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    revenue: totalRevenue,
    expenses: totalExpenses,
    netResult: Number(totalRevenue) - Number(totalExpenses),
    expenseRatio:
      Number(totalRevenue) > 0
        ? Math.round((Number(totalExpenses) / Number(totalRevenue)) * 100)
        : 0,
    categoryBreakdown: expenseByCategory.map((c) => ({
      category: c.category,
      label: EXPENSE_CATEGORY_LABELS[c.category] || c.category,
      amount: c._sum.amount || 0,
    })),
  };
}

// ── Balance Sheet (Bilan comptable) ──
export async function getBalanceSheet(ownerId: string, year?: number) {
  const business = await getBusinessByOwner(ownerId);
  const targetYear = year || new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

  // Assets = total revenue received
  const [totalRevenue, totalExpenses, pendingInvoices, pendingDebts, unpaidInvoices] =
    await Promise.all([
      prisma.order.aggregate({
        where: { businessId: business.id, paidAt: { gte: startDate, lte: endDate } },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { businessId: business.id, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          businessId: business.id,
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true, amountPaid: true },
      }),
      prisma.debt.aggregate({
        where: { businessId: business.id, status: { in: ['ACTIVE', 'OVERDUE', 'CRITICAL'] } },
        _sum: { remainingAmount: true },
      }),
      prisma.quote.aggregate({
        where: { businessId: business.id, status: 'SENT' },
        _sum: { totalAmount: true },
      }),
    ]);

  const revenue = Number(totalRevenue._sum.totalAmount || 0);
  const expenses = Number(totalExpenses._sum.amount || 0);
  const receivables =
    Number(pendingInvoices._sum.totalAmount || 0) - Number(pendingInvoices._sum.amountPaid || 0);
  const debtsOwed = Number(pendingDebts._sum.remainingAmount || 0);
  const quotedNotInvoiced = Number(unpaidInvoices._sum.totalAmount || 0);

  return {
    year: targetYear,
    assets: {
      cash: Math.max(0, revenue - expenses),
      receivables,
      quotedNotInvoiced,
      totalAssets: Math.max(0, revenue - expenses) + receivables + quotedNotInvoiced,
    },
    liabilities: {
      debts: debtsOwed,
      unpaidExpenses: 0,
      totalLiabilities: debtsOwed,
    },
    equity: {
      retainedEarnings: Math.max(0, revenue - expenses - debtsOwed),
      totalEquity: Math.max(0, revenue - expenses - debtsOwed),
    },
  };
}

// ── Income Statement (Compte de résultat) ──
export async function getIncomeStatement(ownerId: string, year?: number) {
  const business = await getBusinessByOwner(ownerId);
  const targetYear = year || new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

  const [monthlyRevenue, monthlyExpenses, expenseByCategory, bookingRevenue] = await Promise.all([
    prisma.order.groupBy({
      by: ['paidAt'],
      where: { businessId: business.id, paidAt: { gte: startDate, lte: endDate } },
      _sum: { totalAmount: true },
    }),
    prisma.expense.groupBy({
      by: ['category', 'date'],
      where: { businessId: business.id, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { businessId: business.id, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.booking.aggregate({
      where: {
        businessId: business.id,
        status: { in: ['COMPLETED', 'IN_PROGRESS'] },
        startDate: { gte: startDate, lte: endDate },
      },
      _sum: { price: true },
    }),
  ]);

  const totalRevenue =
    monthlyRevenue.reduce((s, r) => s + Number(r._sum.totalAmount || 0), 0) +
    Number(bookingRevenue._sum.price || 0);
  const totalExpenses = monthlyExpenses.reduce((s, r) => s + Number(r._sum.amount || 0), 0);

  return {
    year: targetYear,
    revenue: {
      productSales: monthlyRevenue.reduce((s, r) => s + Number(r._sum.totalAmount || 0), 0),
      bookings: Number(bookingRevenue._sum.price || 0),
      totalRevenue,
    },
    expenses: {
      total: totalExpenses,
      byCategory: expenseByCategory.map((c) => ({
        category: c.category,
        label: EXPENSE_CATEGORY_LABELS[c.category] || c.category,
        amount: c._sum.amount || 0,
      })),
    },
    netIncome: totalRevenue - totalExpenses,
    profitMargin:
      totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0,
    expenseRatio: totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0,
  };
}

// ── Accounting Summary (for dashboard page) ──
export async function getAccountingSummary(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRevenue, monthlyRevenue, monthlyExpenses, deductibleTax] = await Promise.all([
    prisma.order.aggregate({
      where: { businessId: business.id, paidAt: { not: null } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { businessId: business.id, paidAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.expense.aggregate({
      where: { businessId: business.id, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { businessId: business.id, taxDeductible: true },
      _sum: { amount: true },
    }),
  ]);

  // Colonne taxAmount peut ne pas exister sur Order, on utilise un try/catch
  let taxCollected = 0;
  try {
    const taxResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COALESCE(SUM("taxAmount"),0) as total FROM "Order" WHERE "businessId" = $1 AND "paidAt" IS NOT NULL`,
      business.id
    );
    taxCollected = Number(taxResult?.[0]?.total || 0);
  } catch {
    // Column may not exist yet, default to 0
    taxCollected = 0;
  }

  const rev = Number(totalRevenue._sum.totalAmount || 0);
  const mRev = Number(monthlyRevenue._sum.totalAmount || 0);
  const mExp = Number(monthlyExpenses._sum.amount || 0);
  const taxDeduct = Number(deductibleTax._sum.amount || 0);

  return {
    totalRevenue: rev,
    monthlyRevenue: mRev,
    monthlyExpenses: mExp,
    netIncome: mRev - mExp,
    revenueTrend: mRev > 0 && rev > 0 ? Math.round(((mRev - rev / 12) / (rev / 12 || 1)) * 100) : 0,
    collectedTax: taxCollected,
    deductibleTax: Math.round(taxDeduct * 0.18),
  };
}

// ── Recent Transactions (for dashboard page) ──
export async function getRecentTransactions(ownerId: string, limit = 5) {
  const business = await getBusinessByOwner(ownerId);

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    prisma.expense.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        description: true,
        amount: true,
        category: true,
        date: true,
        createdAt: true,
      },
    }),
  ]);

  const mappedOrders = orders.map((o) => ({
    id: o.id,
    type: 'INCOME' as const,
    label: `Commande ${o.orderNumber || ''}`,
    description: `Commande ${o.orderNumber || ''}`,
    amount: Number(o.totalAmount || 0),
    status: o.status,
    createdAt: o.paidAt || o.createdAt,
  }));

  const mappedExpenses = expenses.map((e) => ({
    id: e.id,
    type: 'EXPENSE' as const,
    label: e.description || 'Dépense',
    description: e.description || 'Dépense',
    amount: Number(e.amount || 0),
    category: e.category,
    createdAt: e.date || e.createdAt,
  }));

  // Combine and sort by date desc
  const combined = [...mappedOrders, ...mappedExpenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return { transactions: combined };
}

// ── Export CSV ──
export async function exportAccountingCSV(ownerId: string, year?: number) {
  const business = await getBusinessByOwner(ownerId);
  const targetYear = year || new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

  const [expenses, orders] = await Promise.all([
    prisma.expense.findMany({
      where: { businessId: business.id, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    }),
    prisma.order.findMany({
      where: { businessId: business.id, paidAt: { gte: startDate, lte: endDate } },
      orderBy: { paidAt: 'asc' },
      select: { orderNumber: true, totalAmount: true, paidAt: true, status: true },
    }),
  ]);

  let csv = 'Type,Date,Description/Motif,Reference,Montant,Categorie,Statut\n';

  for (const o of orders) {
    csv += `Revenu,${o.paidAt?.toISOString().split('T')[0] || ''},Commande ${o.orderNumber || ''},,${o.totalAmount},VENTES,${o.status}\n`;
  }
  for (const e of expenses) {
    csv += `Dépense,${e.date.toISOString().split('T')[0]},${e.description},${e.reference || ''},${e.amount},${EXPENSE_CATEGORY_LABELS[e.category] || e.category},${e.taxDeductible ? 'Déductible' : 'Non déductible'}\n`;
  }

  return {
    csv,
    filename: `comptabilite_${targetYear}_${business.name.replace(/\s+/g, '_')}.csv`,
    count: orders.length + expenses.length,
  };
}
