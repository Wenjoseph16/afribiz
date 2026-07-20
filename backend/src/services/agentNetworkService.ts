import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessId(ownerId: string) {
  const b = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  if (!b) throw new AppError('Business non trouvé', 404);
  return b.id;
}

export async function listAgents(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  return prisma.agent.findMany({
    where: { businessId },
    include: { _count: { select: { transactions: true, commissions: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAgent(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const agent = await prisma.agent.findFirst({
    where: { id, businessId },
    include: {
      kycDocuments: true,
      transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!agent) throw new AppError('Agent non trouvé', 404);
  return agent;
}

export async function createAgent(
  ownerId: string,
  data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    latitude?: number;
    longitude?: string;
    commissionRate?: number;
    maxTransactionAmount?: number;
  }
) {
  const businessId = await getBusinessId(ownerId);
  return prisma.agent.create({ data: { businessId, ...data } as any });
}

export async function updateAgent(ownerId: string, id: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.agent.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Agent non trouvé', 404);
  return prisma.agent.update({ where: { id }, data });
}

export async function deleteAgent(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.agent.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Agent non trouvé', 404);
  return prisma.agent.delete({ where: { id } });
}

export async function recordAgentTransaction(
  ownerId: string,
  data: { agentId: string; type: string; amount: number; fee?: number; notes?: string }
) {
  const businessId = await getBusinessId(ownerId);
  const agent = await prisma.agent.findFirst({ where: { id: data.agentId, businessId } });
  if (!agent) throw new AppError('Agent non trouvé', 404);
  return prisma.agentTransaction.create({
    data: {
      ...data,
      balanceBefore: 0,
      balanceAfter: data.type === 'DEPOSIT' ? data.amount : -data.amount,
    } as any,
  });
}

export async function listAgentTransactions(ownerId: string, agentId?: string) {
  const businessId = await getBusinessId(ownerId);
  const where: any = { agent: { businessId } };
  if (agentId) where.agentId = agentId;
  return prisma.agentTransaction.findMany({
    where,
    include: { agent: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAgentStats(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  const [totalAgents, activeAgents, totalTransactions, totalCommissions] = await Promise.all([
    prisma.agent.count({ where: { businessId } }),
    prisma.agent.count({ where: { businessId, status: 'ACTIVE' } }),
    prisma.agentTransaction.count({ where: { agent: { businessId } } }),
    prisma.agentCommission.aggregate({ where: { agent: { businessId } }, _sum: { amount: true } }),
  ]);
  return {
    totalAgents,
    activeAgents,
    totalTransactions,
    totalCommissions: Number(totalCommissions._sum.amount || 0),
  };
}
