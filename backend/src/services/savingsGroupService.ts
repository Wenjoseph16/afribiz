import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { FraudDetectionService } from './fraudDetectionService';
import { getOrCreateWallet } from './wallet';
import { calculateCommission } from './monetizationConfig';
import { SavingsGroupType } from '@prisma/client';
import {
  publishSavingsCycleClosed,
  publishSavingsContributionReceived,
  publishSavingsLoanApproved,
} from '../events/publishers';

// ───────── HELPERS ─────────

async function getBusinessId(ownerId: string): Promise<string> {
  const business = await prisma.business.findFirst({ where: { ownerId }, select: { id: true } });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business.id;
}

async function getBusinessOwner(businessId: string) {
  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, name: true, verificationLevel: true },
  });
  if (!b) throw new AppError('Business non trouvé', 404);
  return b;
}

function getSecurityConfig(level: string) {
  switch (level) {
    case 'PLATINE':
      return {
        escrowReleaseDelayHours: 12,
        doubleValidationThreshold: 500000,
        maxLoanAmount: 5000000,
      };
    case 'OR':
      return {
        escrowReleaseDelayHours: 24,
        doubleValidationThreshold: 200000,
        maxLoanAmount: 2000000,
      };
    default:
      return {
        escrowReleaseDelayHours: 48,
        doubleValidationThreshold: 100000,
        maxLoanAmount: 500000,
      };
  }
}

async function updateMemberScore(memberId: string) {
  try {
    const contribs = await prisma.savingsContribution.findMany({
      where: { memberId },
      select: { status: true },
    });
    const loans = await prisma.savingsLoan.findMany({
      where: { memberId, status: { notIn: ['PENDING'] } },
      select: { status: true },
    });
    const total = contribs.length;
    const onTime = contribs.filter((c) => c.status === 'PAID').length;
    const late = contribs.filter((c) => c.status === 'LATE').length;
    const totalLoans = loans.length;
    const repaid = loans.filter((l) => l.status === 'REPAID').length;
    const defaulted = loans.filter((l) => l.status === 'DEFAULTED').length;
    const paymentScore = total > 0 ? Math.round((onTime / total) * 50) : 25;
    const latePenalty = Math.min(late * 5, 25);
    const loanScore = totalLoans > 0 ? Math.round((repaid / totalLoans) * 25) : 0;
    const defaultPenalty = defaulted > 0 ? Math.min(defaulted * 15, 30) : 0;
    const score = Math.max(
      0,
      Math.min(100, 25 + paymentScore - latePenalty + loanScore - defaultPenalty)
    );
    await prisma.savingsMember.update({
      where: { id: memberId },
      data: { reliabilityScore: score },
    });
  } catch (e) {
    logger.error('Score update failed', { error: e });
  }
}

// ───────── GROUP CRUD ─────────

export async function listSavingsGroups(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  return prisma.savingsGroup.findMany({
    where: { businessId },
    include: { _count: { select: { members: true, cycles: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSavingsGroup(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const group = await prisma.savingsGroup.findFirst({
    where: { id, businessId },
    include: {
      members: { where: { isActive: true }, orderBy: { joinedAt: 'desc' } },
      cycles: { orderBy: { startDate: 'desc' }, take: 20 },
    },
  });
  if (!group) throw new AppError('Groupe non trouvé', 404);
  // Get related loans, payouts, escrows via raw queries (no Prisma relations)
  const [loans, payouts, escrows] = await Promise.all([
    prisma.savingsLoan.findMany({
      where: { groupId: id, status: { notIn: ['REPAID'] } },
      include: { repayments: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.savingsPayout.findMany({
      where: { groupId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.escrow.findMany({
      where: { businessId, savingsGroupId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);
  return { ...group, loans, payouts, escrows };
}

export async function createSavingsGroup(
  ownerId: string,
  data: Partial<{
    name: string;
    description?: string;
    type?: string;
    currency?: string;
    contributionAmount?: number;
    frequency?: string;
    maxMembers?: number;
  }>
) {
  const businessId = await getBusinessId(ownerId);
  const allowed = {
    businessId,
    name: data.name || 'Nouveau groupe',
    description: data.description || '',
    type: Object.values(SavingsGroupType).includes(data.type as SavingsGroupType)
      ? (data.type as SavingsGroupType)
      : SavingsGroupType.ROTATING,
    currency: data.currency || 'FCFA',
    contributionAmount: data.contributionAmount || 0,
    frequency: data.frequency || 'monthly',
    maxMembers: data.maxMembers || 10,
  };
  const group = await prisma.savingsGroup.create({ data: allowed });
  await prisma.savingsMember.create({
    data: {
      groupId: group.id,
      name: 'Gestionnaire',
      role: 'admin',
      isActive: true,
      reliabilityScore: 100,
    },
  });
  return group;
}

export async function updateSavingsGroup(ownerId: string, id: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.savingsGroup.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Groupe non trouvé', 404);
  return prisma.savingsGroup.update({ where: { id }, data });
}

export async function deleteSavingsGroup(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.savingsGroup.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Groupe non trouvé', 404);
  const activeEscrows = await prisma.escrow.count({
    where: { businessId, savingsGroupId: id, status: 'HELD' },
  });
  if (activeEscrows > 0) throw new AppError('Des fonds sont séquestrés sur ce groupe', 400);
  return prisma.savingsGroup.update({ where: { id }, data: { status: 'CANCELLED' } });
}

// ───────── MEMBERS ─────────

export async function addSavingsMember(
  ownerId: string,
  data: { groupId: string; name: string; phone?: string; email?: string }
) {
  const businessId = await getBusinessId(ownerId);
  const group = await prisma.savingsGroup.findFirst({ where: { id: data.groupId, businessId } });
  if (!group) throw new AppError('Groupe non trouvé', 404);
  if (group.status !== 'ACTIVE') throw new AppError("Le groupe n'est pas actif", 400);
  return prisma.savingsMember.create({
    data: {
      groupId: data.groupId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      role: 'member',
      isActive: true,
      reliabilityScore: 50,
    },
  });
}

export async function removeSavingsMember(ownerId: string, memberId: string) {
  const businessId = await getBusinessId(ownerId);
  const member = await prisma.savingsMember.findFirst({
    where: { id: memberId, group: { businessId } },
  });
  if (!member) throw new AppError('Membre non trouvé', 404);
  const unpaid = await prisma.savingsContribution.count({ where: { memberId, status: 'PENDING' } });
  if (unpaid > 0) throw new AppError('Ce membre a des cotisations impayées', 400);
  const activeLoan = await prisma.savingsLoan.findFirst({
    where: { memberId, status: { in: ['ACTIVE', 'APPROVED'] } },
  });
  if (activeLoan) throw new AppError('Ce membre a un prêt actif', 400);
  return prisma.savingsMember.update({
    where: { id: memberId },
    data: { isActive: false, leftAt: new Date() },
  });
}

export async function getMemberScore(ownerId: string, memberId: string) {
  const businessId = await getBusinessId(ownerId);
  const member = await prisma.savingsMember.findFirst({
    where: { id: memberId, group: { businessId } },
  });
  if (!member) throw new AppError('Membre non trouvé', 404);
  const [contribs, loans] = await Promise.all([
    prisma.savingsContribution.findMany({
      where: { memberId },
      select: { status: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.savingsLoan.findMany({
      where: { memberId },
      select: { status: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);
  const total = contribs.length;
  const onTime = contribs.filter((c) => c.status === 'PAID').length;
  const late = contribs.filter((c) => c.status === 'LATE').length;
  const totalLoans = loans.length;
  const repaid = loans.filter((l) => l.status === 'REPAID').length;
  const defaulted = loans.filter((l) => l.status === 'DEFAULTED').length;
  const paymentScore = total > 0 ? Math.round((onTime / total) * 50) : 25;
  const latePenalty = Math.min(late * 5, 25);
  const loanScore = totalLoans > 0 ? Math.round((repaid / totalLoans) * 25) : 0;
  const defaultPenalty = defaulted > 0 ? Math.min(defaulted * 15, 30) : 0;
  const score = Math.max(
    0,
    Math.min(100, 25 + paymentScore - latePenalty + loanScore - defaultPenalty)
  );
  return {
    score,
    totalContributions: total,
    onTime,
    late,
    onTimeRate: total > 0 ? Math.round((onTime / total) * 100) : 0,
    totalLoans,
    repaid,
    defaulted,
    loanRepaymentRate: totalLoans > 0 ? Math.round((repaid / totalLoans) * 100) : 0,
    level: score >= 80 ? 'EXCELLENT' : score >= 60 ? 'BON' : score >= 40 ? 'MOYEN' : 'FAIBLE',
    storedScore: member.reliabilityScore,
  };
}

// ───────── CYCLES ─────────

export async function startSavingsCycle(ownerId: string, groupId: string, startDate?: string) {
  const businessId = await getBusinessId(ownerId);
  const group = await prisma.savingsGroup.findFirst({ where: { id: groupId, businessId } });
  if (!group) throw new AppError('Groupe non trouvé', 404);
  if (group.status !== 'ACTIVE') throw new AppError('Groupe inactif', 400);
  const activeCycle = await prisma.savingsCycle.findFirst({ where: { groupId, status: 'ACTIVE' } });
  if (activeCycle) throw new AppError('Un cycle est déjà en cours', 400);
  const memberCount = await prisma.savingsMember.count({ where: { groupId, isActive: true } });
  if (memberCount < 2) throw new AppError('Minimum 2 membres actifs requis', 400);
  const maxCycle = await prisma.savingsCycle.findFirst({
    where: { groupId },
    orderBy: { cycleNumber: 'desc' },
    select: { cycleNumber: true },
  });
  const cycleNumber = (maxCycle?.cycleNumber || 0) + 1;
  return prisma.savingsCycle.create({
    data: {
      groupId,
      cycleNumber,
      startDate: startDate ? new Date(startDate) : new Date(),
      status: 'ACTIVE',
    },
  });
}

export async function closeSavingsCycle(ownerId: string, cycleId: string) {
  const businessId = await getBusinessId(ownerId);
  const cycle = (await prisma.savingsCycle.findFirst({
    where: { id: cycleId, group: { businessId } },
    include: {
      group: { select: { id: true, businessId: true, name: true, type: true } },
      contributions: { where: { status: { in: ['PAID'] } } },
    } as any,
  })) as any;
  if (!cycle) throw new AppError('Cycle non trouvé', 404);
  if (cycle.status !== 'ACTIVE') throw new AppError('Cycle déjà terminé', 400);
  const totalMembers = await prisma.savingsMember.count({
    where: { groupId: cycle.groupId, isActive: true },
  });
  const paidCount = cycle.contributions.length;
  const participationRate = totalMembers > 0 ? (paidCount / totalMembers) * 100 : 0;
  if (participationRate < 80)
    throw new AppError(
      `Taux de participation insuffisant: ${Math.round(participationRate)}% (min 80%)`,
      400
    );

  const business = await getBusinessOwner(businessId);
  const config = getSecurityConfig(business.verificationLevel);
  const totalCollected = cycle.contributions.reduce(
    (sum: number, c: any) => sum + Number(c.amount),
    0
  );
  const releaseAt = new Date(Date.now() + config.escrowReleaseDelayHours * 60 * 60 * 1000);

  const updated = await prisma.savingsCycle.update({
    where: { id: cycleId },
    data: {
      status: 'COMPLETED',
      endDate: new Date(),
      totalAmount: totalCollected,
      totalCollected,
      totalDistributed: totalCollected,
      payoutDate: releaseAt,
      releaseAt,
      completedAt: new Date(),
    },
  });

  // Create escrow
  if (totalCollected > 0) {
    const { rate, commission, netAmount } = await calculateCommission(totalCollected, 'escrow');
    await prisma.escrow.create({
      data: {
        businessId: cycle.group.businessId,
        savingsGroupId: cycle.group.id,
        savingsCycleId: cycleId,
        amount: totalCollected,
        currency: 'FCFA',
        status: 'HELD',
        fee: commission,
        feeRate: rate,
        netAmount,
        notes: JSON.stringify({
          type: 'SAVINGS_CYCLE',
          cycleId,
          groupId: cycle.group.id,
          groupName: cycle.group.name,
          totalCollected,
          fee: commission,
          netAmount,
          releaseAt: releaseAt.toISOString(),
          requiresDoubleValidation: totalCollected >= config.doubleValidationThreshold,
          validatedBy: [],
        }),
      },
    });
    try {
      await prisma.financialLog.create({
        data: {
          businessId: cycle.group.businessId,
          action: 'MANUAL_ADJUSTMENT',
          amount: -commission,
          description: `Commission ${rate * 100}% sur cycle tontine ${totalCollected} FCFA`,
          metadata: {
            commissionType: 'SAVINGS_ESCROW_FEE',
            cycleId,
            groupId: cycle.group.id,
            amount: totalCollected,
            fee: commission,
            netAmount,
          },
        },
      });
    } catch (e) {
      logger.error('Failed to log commission', { error: e });
    }
  }

  if (totalCollected > config.doubleValidationThreshold) {
    try {
      await FraudDetectionService.checkTransactionVelocity(business.ownerId);
    } catch (e) {
      logger.error('Fraud check', { error: e });
    }
  }

  // Publier événement notification
  try {
    publishSavingsCycleClosed({
      userId: business.ownerId,
      businessId,
      groupName: cycle.group.name,
      cycleNumber: cycle.cycleNumber,
      totalCollected,
      groupId: cycle.group.id,
      cycleId,
    });
  } catch (e) {
    logger.error('Failed to publish cycle event', { error: e });
  }

  return {
    ...updated,
    releaseAt,
    requiresValidation: totalCollected >= config.doubleValidationThreshold,
  };
}

export async function validateCycleClosure(ownerId: string, cycleId: string) {
  const businessId = await getBusinessId(ownerId);
  const cycle = (await prisma.savingsCycle.findFirst({
    where: { id: cycleId, group: { businessId } },
    include: { group: { select: { id: true, businessId: true } } },
  })) as any;
  if (!cycle) throw new AppError('Cycle non trouvé', 404);
  if (cycle.status !== 'COMPLETED') throw new AppError("Le cycle doit d'abord être clôturé", 400);
  const escrow = await prisma.escrow.findFirst({
    where: { savingsCycleId: cycleId, savingsGroupId: cycle.group.id },
  });
  if (!escrow) throw new AppError('Aucun escrow trouvé', 404);
  if (escrow.status !== 'HELD') throw new AppError('Escrow déjà traité', 400);
  const notes =
    typeof escrow.notes === 'string'
      ? JSON.parse(escrow.notes)
      : escrow.notes || { validatedBy: [] };
  if (!notes.validatedBy) notes.validatedBy = [];
  if (notes.validatedBy.includes(ownerId)) throw new AppError('Déjà validé', 400);
  notes.validatedBy.push(ownerId);
  await prisma.escrow.update({ where: { id: escrow.id }, data: { notes: JSON.stringify(notes) } });
  return { validated: true, validators: notes.validatedBy.length };
}

export async function processCyclePayouts(ownerId: string, cycleId: string) {
  const businessId = await getBusinessId(ownerId);
  const cycle = (await prisma.savingsCycle.findFirst({
    where: { id: cycleId, group: { businessId } },
    include: {
      group: { select: { id: true, businessId: true, name: true, type: true } },
      contributions: { where: { status: { in: ['PAID'] } } },
    } as any,
  })) as any;
  if (!cycle) throw new AppError('Cycle non trouvé', 404);
  const escrow = await prisma.escrow.findFirst({
    where: { savingsCycleId: cycleId, savingsGroupId: cycle.group.id },
  });
  if (!escrow) throw new AppError('Aucun escrow', 404);
  if (escrow.status !== 'HELD') throw new AppError('Escrow déjà traité', 400);
  if (cycle.releaseAt && cycle.releaseAt > new Date()) {
    const h = Math.round((cycle.releaseAt.getTime() - Date.now()) / (1000 * 60 * 60));
    throw new AppError(`Délai rétractation: ${h}h restantes`, 400);
  }
  const notes = typeof escrow.notes === 'string' ? JSON.parse(escrow.notes) : escrow.notes || {};
  if (notes.requiresDoubleValidation && (!notes.validatedBy || notes.validatedBy.length < 2)) {
    throw new AppError(
      `Nécessite ${2 - (notes.validatedBy?.length || 0)} validation(s) supplémentaire(s)`,
      400
    );
  }
  const netAmount = Number(escrow.netAmount || escrow.amount);
  if (cycle.group.type === 'ROTATING') {
    const prevPayouts = await prisma.savingsPayout.count({ where: { groupId: cycle.group.id } });
    const activeMembers = await prisma.savingsMember.findMany({
      where: { groupId: cycle.group.id, isActive: true },
      orderBy: { joinedAt: 'asc' },
    });
    const winnerIndex = prevPayouts % activeMembers.length;
    const winner = activeMembers[winnerIndex];
    if (!winner) throw new AppError('Aucun membre disponible', 404);
    await prisma.savingsPayout.create({
      data: {
        groupId: cycle.group.id,
        memberId: winner.id,
        cycleId,
        amount: netAmount,
        type: 'CYCLE_WINNER',
        paidAt: new Date(),
        method: 'escrow',
      },
    });
    await getOrCreateWallet(businessId);
    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({ where: { businessId } });
      if (w) {
        const nb = Number(w.balance) + netAmount;
        await tx.wallet.update({ where: { businessId }, data: { balance: nb } });
        await tx.walletTransaction.create({
          data: {
            walletId: w.id,
            type: 'ESCROW_RELEASE',
            amount: netAmount,
            balanceBefore: Number(w.balance),
            balanceAfter: nb,
            reference: 'cycle-' + cycleId,
            description: `Tontine cycle #${cycleId} (frais: ${Number(escrow.fee)})`,
          },
        });
      }
    });
    await prisma.escrow.update({
      where: { id: escrow.id },
      data: { status: 'RELEASED', releasedAt: new Date(), releasedToWallet: true, netAmount },
    });
    await updateMemberScore(winner.id);
    return {
      payout: { memberId: winner.id, memberName: winner.name },
      winnerName: winner.name,
      amount: netAmount,
      fee: Number(escrow.fee),
    };
  }

  // FIXED / FREE → créditer wallet
  await getOrCreateWallet(businessId);
  await prisma.$transaction(async (tx) => {
    const w = await tx.wallet.findUnique({ where: { businessId } });
    if (w) {
      const nb = Number(w.balance) + netAmount;
      await tx.wallet.update({ where: { businessId }, data: { balance: nb } });
      await tx.walletTransaction.create({
        data: {
          walletId: w.id,
          type: 'ESCROW_RELEASE',
          amount: netAmount,
          balanceBefore: Number(w.balance),
          balanceAfter: nb,
          reference: 'cycle-' + cycleId,
          description: `Cycle tontine #${cycleId} (frais: ${Number(escrow.fee)})`,
        },
      });
    }
  });
  await prisma.escrow.update({
    where: { id: escrow.id },
    data: { status: 'RELEASED', releasedAt: new Date(), releasedToWallet: true, netAmount },
  });
  return { message: 'Fonds crédités wallet', amount: netAmount, fee: Number(escrow.fee) };
}

// ───────── CONTRIBUTIONS ─────────

export async function recordContribution(
  ownerId: string,
  data: { cycleId: string; memberId: string; amount: number; method?: string; notes?: string }
) {
  const businessId = await getBusinessId(ownerId);
  const cycle = await prisma.savingsCycle.findFirst({
    where: { id: data.cycleId, group: { businessId } },
    include: { group: { select: { id: true, businessId: true, name: true } } },
  });
  if (!cycle) throw new AppError('Cycle non trouvé', 404);
  if (cycle.status !== 'ACTIVE') throw new AppError('Cycle inactif', 400);
  const member = await prisma.savingsMember.findFirst({
    where: { id: data.memberId, groupId: cycle.group.id, isActive: true },
  });
  if (!member) throw new AppError('Membre non trouvé', 404);
  const existing = await prisma.savingsContribution.findFirst({
    where: { cycleId: data.cycleId, memberId: data.memberId },
  });
  if (existing) throw new AppError('Ce membre a déjà cotisé', 400);
  if (Number(data.amount) <= 0) throw new AppError('Le montant doit être supérieur à 0', 400);
  try {
    const fraud = await FraudDetectionService.checkTransactionVelocity(ownerId);
    if (fraud.blocked) throw new AppError('Bloqué: suspicion fraude', 403);
  } catch (e) {
    if (e instanceof AppError) throw e;
  }

  const contrib = await prisma.savingsContribution.create({
    data: {
      cycleId: data.cycleId,
      memberId: data.memberId,
      amount: Number(data.amount),
      method: data.method || 'CASH',
      status: 'PAID',
      paidAt: new Date(),
      notes: data.notes || '',
    },
  });
  await prisma.savingsMember.update({
    where: { id: data.memberId },
    data: { totalContributed: { increment: data.amount } },
  });
  await updateMemberScore(data.memberId);
  // Publier événement notification
  try {
    publishSavingsContributionReceived({
      userId: ownerId,
      businessId,
      memberName: member.name,
      amount: Number(data.amount),
      groupName: cycle.group.name,
      groupId: cycle.group.id,
    });
  } catch (e) {
    logger.error('Failed to publish contribution event', { error: e });
  }
  return contrib;
}

// ───────── LOANS ─────────

export async function listLoans(ownerId: string, groupId?: string) {
  const businessId = await getBusinessId(ownerId);
  const where: any = { group: { businessId } };
  if (groupId) where.groupId = groupId;
  return prisma.savingsLoan.findMany({
    where,
    include: { repayments: { orderBy: { createdAt: 'desc' } } } as any,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createLoan(
  ownerId: string,
  data: {
    groupId: string;
    memberId: string;
    amount: number;
    interestRate?: number;
    purpose?: string;
    durationMonths?: number;
  }
) {
  const businessId = await getBusinessId(ownerId);
  const group = await prisma.savingsGroup.findFirst({
    where: { id: data.groupId, businessId },
    include: {
      members: {
        where: { id: data.memberId, isActive: true },
        select: { id: true, reliabilityScore: true, totalContributed: true },
      },
    },
  });
  if (!group) throw new AppError('Groupe non trouvé', 404);
  if (group.status !== 'ACTIVE') throw new AppError('Groupe inactif', 400);
  const member = group.members[0];
  if (!member) throw new AppError('Membre non trouvé', 404);
  const business = await getBusinessOwner(businessId);
  const config = getSecurityConfig(business.verificationLevel);
  const reliabilityScore = member.reliabilityScore ?? 0;
  const maxLoan =
    reliabilityScore >= 80
      ? Math.max(Number(member.totalContributed || 0) * 2, config.maxLoanAmount)
      : Math.min(Number(member.totalContributed || 0), config.maxLoanAmount);
  if (data.amount > maxLoan)
    throw new AppError(`Max: ${maxLoan.toLocaleString()} FCFA (score: ${reliabilityScore})`, 400);
  const activeCount = await prisma.savingsLoan.count({
    where: { memberId: data.memberId, status: { in: ['ACTIVE', 'APPROVED'] } },
  });
  if (activeCount >= 3) throw new AppError('Max 3 prêts en cours', 400);
  const interestRate = data.interestRate || 0;
  if (data.amount <= 0) throw new AppError('Le montant doit être supérieur à 0', 400);
  const totalRepay = data.amount + Math.round((data.amount * interestRate) / 100);
  return prisma.savingsLoan.create({
    data: {
      groupId: data.groupId,
      memberId: data.memberId,
      amount: data.amount,
      interestRate,
      totalRepay,
      durationMonths: data.durationMonths || 1,
      purpose: data.purpose || '',
      status: 'PENDING',
    },
  });
}

export async function approveLoan(ownerId: string, loanId: string) {
  const businessId = await getBusinessId(ownerId);
  const loan = (await prisma.savingsLoan.findFirst({
    where: { id: loanId, group: { businessId } } as any,
  })) as any;
  if (!loan) throw new AppError('Prêt non trouvé', 404);
  if (loan.status !== 'PENDING') throw new AppError('Prêt déjà traité', 400);
  if ((loan.reliabilityScore ?? 0) < 40)
    throw new AppError(`Score insuffisant (${loan.reliabilityScore ?? 0}/100)`, 400);
  const approved = await prisma.savingsLoan.update({
    where: { id: loanId },
    data: { status: 'ACTIVE', approvedAt: new Date() },
  });
  // Publier événement notification
  try {
    const business = await getBusinessOwner(businessId);
    publishSavingsLoanApproved({
      userId: business.ownerId,
      businessId,
      memberName: loan.memberName || 'Membre',
      amount: Number(loan.amount),
      groupName: loan.groupName || 'Groupe',
      groupId: loan.groupId,
    });
  } catch (e) {
    logger.error('Failed to publish loan event', { error: e });
  }
  return approved;
}

export async function repayLoan(ownerId: string, loanId: string, amount: number, method?: string) {
  const businessId = await getBusinessId(ownerId);
  const loan = await prisma.savingsLoan.findFirst({
    where: { id: loanId, group: { businessId } } as any,
  });
  if (!loan) throw new AppError('Prêt non trouvé', 404);
  if (loan.status !== 'ACTIVE') throw new AppError('Prêt pas actif', 400);
  await prisma.savingsLoanRepayment.create({
    data: { loanId, amount, paidAt: new Date(), method: method || 'CASH' },
  });
  const totalPaid = await prisma.savingsLoanRepayment.aggregate({
    where: { loanId },
    _sum: { amount: true },
  });
  const repaidTotal = Number(totalPaid._sum.amount || 0);
  const isRepaid = repaidTotal >= Number(loan.totalRepay);
  const updated = await prisma.savingsLoan.update({
    where: { id: loanId },
    data: { status: isRepaid ? 'REPAID' : 'ACTIVE', repaidAt: isRepaid ? new Date() : undefined },
  });
  await updateMemberScore(loan.memberId || '');
  return { ...updated, repaidAmount: repaidTotal, totalToRepay: Number(loan.totalRepay) };
}

// ───────── PAYOUT STATUS ─────────

export async function getCyclePayoutStatus(ownerId: string, cycleId: string) {
  const businessId = await getBusinessId(ownerId);
  const cycle = await prisma.savingsCycle.findFirst({
    where: { id: cycleId, group: { businessId } },
    include: { group: { select: { id: true, name: true, type: true } } },
  });
  if (!cycle) throw new AppError('Cycle non trouvé', 404);
  const [payouts, contributions, escrow] = await Promise.all([
    prisma.savingsPayout.findMany({ where: { cycleId } }),
    prisma.savingsContribution.findMany({
      where: { cycleId, status: 'PAID' },
      include: { member: { select: { id: true, name: true } } },
    }),
    prisma.escrow.findFirst({ where: { savingsCycleId: cycleId, savingsGroupId: cycle.group.id } }),
  ]);
  const business = await getBusinessOwner(businessId);
  const config = getSecurityConfig(business.verificationLevel);
  const totalCollected = contributions.reduce((s, c) => s + Number(c.amount), 0);
  return {
    cycleId: cycle.id,
    status: cycle.status,
    totalCollected,
    totalMembers: contributions.length,
    releaseAt: cycle.releaseAt,
    canRelease: cycle.releaseAt ? cycle.releaseAt <= new Date() : false,
    hoursUntilRelease: cycle.releaseAt
      ? Math.max(0, Math.round((cycle.releaseAt.getTime() - Date.now()) / (1000 * 60 * 60)))
      : 0,
    doubleValidationRequired: totalCollected >= config.doubleValidationThreshold,
    validationsCompleted:
      escrow && typeof escrow.notes === 'string'
        ? JSON.parse(escrow.notes).validatedBy?.length || 0
        : 0,
    escrow: escrow
      ? {
          id: escrow.id,
          amount: Number(escrow.amount),
          fee: Number(escrow.fee),
          netAmount: Number(escrow.netAmount || escrow.amount),
          status: escrow.status,
          releasedAt: escrow.releasedAt,
        }
      : null,
    payouts,
  };
}

export async function getGroupEscrows(ownerId: string, groupId: string) {
  const businessId = await getBusinessId(ownerId);
  const group = await prisma.savingsGroup.findFirst({
    where: { id: groupId, businessId },
    select: { id: true },
  });
  if (!group) throw new AppError('Groupe non trouvé', 404);
  return prisma.escrow.findMany({
    where: { businessId, savingsGroupId: groupId },
    orderBy: { createdAt: 'desc' },
  });
}

// ───────── STATS ─────────

export async function getSavingsStats(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  const [
    totalGroups,
    totalMembers,
    totalSaved,
    totalLoaned,
    activeCycles,
    pendingEscrows,
    activeLoans,
  ] = await Promise.all([
    prisma.savingsGroup.count({ where: { businessId } }),
    prisma.savingsMember.count({ where: { group: { businessId }, isActive: true } }),
    prisma.savingsContribution.aggregate({
      where: { cycle: { group: { businessId } }, status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.savingsLoan.aggregate({
      where: { group: { businessId }, status: { in: ['ACTIVE', 'APPROVED'] } } as any,
      _sum: { amount: true },
    }),
    prisma.savingsCycle.count({ where: { group: { businessId }, status: 'ACTIVE' } }),
    prisma.escrow.count({ where: { businessId, savingsGroupId: { not: null }, status: 'HELD' } }),
    prisma.savingsLoan.count({
      where: { group: { businessId }, status: { in: ['ACTIVE', 'APPROVED'] } } as any,
    }),
  ]);
  const allContribs = await prisma.savingsContribution.findMany({
    where: { cycle: { group: { businessId } } },
    select: { status: true },
  });
  const totalC = allContribs.length;
  const onTimeC = allContribs.filter((c) => c.status === 'PAID').length;
  const scores = await prisma.savingsMember.findMany({
    where: { group: { businessId }, isActive: true },
    select: { reliabilityScore: true },
  });
  const avgReliability =
    scores.length > 0
      ? Math.round(scores.reduce((s, m) => s + (m.reliabilityScore || 50), 0) / scores.length)
      : 0;
  return {
    totalGroups,
    totalMembers,
    activeCycles,
    totalSaved: Number(totalSaved._sum?.amount || 0),
    totalLoaned: Number(totalLoaned._sum?.amount || 0),
    pendingEscrows,
    activeLoans,
    participationRate: totalC > 0 ? Math.round((onTimeC / totalC) * 100) : 0,
    avgReliability,
    healthScore: totalC > 0 ? Math.round((onTimeC / totalC) * 50 + avgReliability / 2) : 0,
  };
}
