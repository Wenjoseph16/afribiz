import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessId(ownerId: string) {
  const b = await prisma.business.findFirst({ where: { ownerId }, select: { id: true } });
  if (!b) throw new AppError('Business non trouvé', 404);
  return b.id;
}

export async function listVoiceCommands() {
  return prisma.voiceCommand.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createVoiceCommand(data: {
  command: string;
  action: string;
  params?: any;
  language?: string;
}) {
  return prisma.voiceCommand.create({ data: { ...data, isActive: true } as any });
}

export async function updateVoiceCommand(id: string, data: any) {
  const existing = await prisma.voiceCommand.findUnique({ where: { id } });
  if (!existing) throw new AppError('Commande vocale non trouvée', 404);
  return prisma.voiceCommand.update({ where: { id }, data });
}

export async function deleteVoiceCommand(id: string) {
  const existing = await prisma.voiceCommand.findUnique({ where: { id } });
  if (!existing) throw new AppError('Commande vocale non trouvée', 404);
  return prisma.voiceCommand.delete({ where: { id } });
}

export async function listVoiceQueries(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  return prisma.voiceQuery.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } });
}

export async function createVoiceQuery(
  ownerId: string,
  data: { query: string; language?: string; deviceInfo?: string }
) {
  const businessId = await getBusinessId(ownerId);
  const query = data.query.toLowerCase();
  const response = '';
  let action = 'SEARCH';
  if (query.includes('commander') || query.includes('acheter')) action = 'ORDER';
  else if (query.includes('reserver') || query.includes('book')) action = 'BOOK';
  else if (query.includes('appeler') || query.includes('contact')) action = 'CALL';
  return prisma.voiceQuery.create({
    data: {
      businessId,
      query: data.query,
      language: data.language || 'fr',
      action,
      response,
      deviceInfo: data.deviceInfo,
    } as any,
  });
}

export async function getVoiceStats(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  const [totalQueries, byAction] = await Promise.all([
    prisma.voiceQuery.count({ where: { businessId } }),
    prisma.voiceQuery.groupBy({ by: ['action' as any], where: { businessId }, _count: true }),
  ]);
  return {
    totalQueries,
    byAction: byAction.map((a: any) => ({ action: a.action, count: a._count })),
  };
}
