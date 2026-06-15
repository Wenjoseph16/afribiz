import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function ensureBusinessClient(businessId: string, clientId: string) {
  const userExists = await prisma.user.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!userExists) throw new AppError('Client non trouvé', 404);
  return prisma.businessClient.upsert({
    where: { businessId_clientId: { businessId, clientId } },
    create: { businessId, clientId },
    update: {},
  });
}

export async function getBusinessClients(
  businessId: string,
  params: {
    search?: string;
    tagId?: string;
    segmentId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }
) {
  const { search, tagId, segmentId, isActive, sortBy = 'lastOrderAt', sortOrder = 'desc', limit = 50, offset = 0 } = params;

  const where: Prisma.BusinessClientWhereInput = { businessId };

  if (isActive !== undefined) where.isActive = isActive;
  if (tagId) where.tags = { some: { tagId } };
  if (segmentId) where.segments = { some: { segmentId } };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { client: { firstName: { contains: search, mode: 'insensitive' } } },
      { client: { lastName: { contains: search, mode: 'insensitive' } } },
      { client: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const orderBy: Prisma.BusinessClientOrderByWithRelationInput[] = [{ [sortBy]: sortOrder }];

  const [clients, total] = await Promise.all([
    prisma.businessClient.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, city: true },
        },
        tags: { include: { tag: true } },
        segments: { include: { segment: { select: { id: true, name: true, color: true } } } },
      },
    }),
    prisma.businessClient.count({ where }),
  ]);

  return {
    clients: clients.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      firstName: c.firstName || c.client.firstName,
      lastName: c.lastName || c.client.lastName,
      email: c.email || c.client.email,
      phone: c.phone || c.client.phone,
      city: c.city || c.client.city || undefined,
      avatar: c.client.avatar,
      totalOrders: c.totalOrders,
      totalSpent: Number(c.totalSpent),
      lastOrderAt: c.lastOrderAt,
      lastVisitAt: c.lastVisitAt,
      isActive: c.isActive,
      tags: c.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
      segments: c.segments.map((s) => ({ id: s.segment.id, name: s.segment.name, color: s.segment.color })),
      createdAt: c.createdAt,
    })),
    total,
    limit,
    offset,
  };
}

export async function getClientDetail(businessId: string, clientId: string) {
  const bc = await ensureBusinessClient(businessId, clientId);

  const [businessClient, orders, bookings, debts, loyalty, clientRisk, allBusinessTags] = await Promise.all([
    prisma.businessClient.findUnique({
      where: { id: bc.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, birthDate: true, city: true, neighborhood: true, country: true, createdAt: true } },
        tags: { include: { tag: true } },
        segments: { include: { segment: { select: { id: true, name: true, color: true } } } },
        notes: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    }),
    prisma.order.findMany({
      where: { businessId, buyerId: clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true, updatedAt: true },
    }),
    prisma.booking.findMany({
      where: { businessId, clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, status: true, startDate: true, endDate: true, price: true, createdAt: true, type: true },
    }),
    prisma.debt.findMany({
      where: { businessId, buyerId: clientId, status: { not: 'SETTLED' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, totalAmount: true, remainingAmount: true, status: true, createdAt: true },
    }),
    prisma.loyaltyPoints.findUnique({
      where: { businessId_clientId: { businessId, clientId } },
    }),
    prisma.clientRisk.findUnique({
      where: { businessId_clientId: { businessId, clientId } },
    }),
    prisma.businessTag.findMany({
      where: { businessId },
    }),
  ]);

  if (!businessClient) throw new AppError('Client non trouvé', 404);

  return {
    ...businessClient,
    totalSpent: Number(businessClient.totalSpent),
    client: {
      ...businessClient.client,
      fullName: `${businessClient.client.firstName} ${businessClient.client.lastName}`.trim(),
    },
    tags: businessClient.tags.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })),
    segments: businessClient.segments.map((s) => ({ id: s.segment.id, name: s.segment.name, color: s.segment.color })),
    notes: businessClient.notes.map((n) => ({ id: n.id, content: n.content, createdBy: n.createdBy, createdAt: n.createdAt })),
    orders: orders.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) })),
    bookings: bookings.map((b) => ({ ...b, price: Number(b.price) })),
    debts: debts.map((d) => ({ ...d, totalAmount: Number(d.totalAmount), remainingAmount: Number(d.remainingAmount) })),
    loyalty: loyalty ? { ...loyalty, totalPoints: loyalty.totalPoints, lifetimePoints: loyalty.lifetimePoints } : null,
    clientRisk: clientRisk
      ? { ...clientRisk, totalDebtAmount: clientRisk.totalDebtAmount ? Number(clientRisk.totalDebtAmount) : 0, maxCreditAmount: clientRisk.maxCreditAmount ? Number(clientRisk.maxCreditAmount) : null }
      : null,
    allTags: allBusinessTags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
  };
}

export async function addClientNote(businessId: string, clientId: string, content: string, createdBy?: string) {
  const bc = await ensureBusinessClient(businessId, clientId);
  return prisma.clientNote.create({
    data: { businessClientId: bc.id, content, createdBy },
  });
}

export async function getTags(businessId: string) {
  return prisma.businessTag.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { clients: true } } },
  });
}

export async function createTag(businessId: string, name: string, color?: string) {
  const existing = await prisma.businessTag.findUnique({
    where: { businessId_name: { businessId, name } },
  });
  if (existing) throw new AppError('Ce tag existe déjà', 409);
  return prisma.businessTag.create({
    data: { businessId, name, color: color || '#6366f1' },
  });
}

export async function deleteTag(businessId: string, tagId: string) {
  const tag = await prisma.businessTag.findFirst({
    where: { id: tagId, businessId },
  });
  if (!tag) throw new AppError('Tag non trouvé', 404);
  await prisma.businessTag.delete({ where: { id: tagId } });
}

export async function assignTag(businessId: string, clientId: string, tagId: string) {
  const bc = await ensureBusinessClient(businessId, clientId);
  const tag = await prisma.businessTag.findFirst({ where: { id: tagId, businessId } });
  if (!tag) throw new AppError('Tag non trouvé', 404);

  await prisma.businessClientTag.upsert({
    where: { clientId_tagId: { clientId: bc.id, tagId } },
    create: { clientId: bc.id, tagId },
    update: {},
  });
}

export async function removeTag(businessId: string, clientId: string, tagId: string) {
  const bc = await ensureBusinessClient(businessId, clientId);
  const tag = await prisma.businessTag.findFirst({ where: { id: tagId, businessId } });
  if (!tag) throw new AppError('Tag non trouvé', 404);

  await prisma.businessClientTag.deleteMany({
    where: { clientId: bc.id, tagId },
  });
}

export async function getSegments(businessId: string) {
  const segments = await prisma.clientSegment.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { clients: true } } },
  });
  return segments;
}

export async function createSegment(
  businessId: string,
  data: {
    name: string;
    description?: string;
    color?: string;
    conditions?: any;
    isDynamic?: boolean;
  }
) {
  const existing = await prisma.clientSegment.findUnique({
    where: { businessId_name: { businessId, name: data.name } },
  });
  if (existing) throw new AppError('Ce segment existe déjà', 409);

  return prisma.clientSegment.create({
    data: {
      businessId,
      name: data.name,
      description: data.description,
      color: data.color || '#6366f1',
      conditions: data.conditions || Prisma.DbNull,
      isDynamic: data.isDynamic ?? true,
    },
  });
}

export async function updateSegment(
  businessId: string,
  segmentId: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    conditions?: any;
    isDynamic?: boolean;
    isActive?: boolean;
  }
) {
  const segment = await prisma.clientSegment.findFirst({
    where: { id: segmentId, businessId },
  });
  if (!segment) throw new AppError('Segment non trouvé', 404);

  return prisma.clientSegment.update({
    where: { id: segmentId },
    data,
  });
}

export async function deleteSegment(businessId: string, segmentId: string) {
  const segment = await prisma.clientSegment.findFirst({
    where: { id: segmentId, businessId },
  });
  if (!segment) throw new AppError('Segment non trouvé', 404);
  await prisma.clientSegment.delete({ where: { id: segmentId } });
}

export async function assignClientToSegment(businessId: string, clientId: string, segmentId: string) {
  const bc = await ensureBusinessClient(businessId, clientId);
  const segment = await prisma.clientSegment.findFirst({ where: { id: segmentId, businessId } });
  if (!segment) throw new AppError('Segment non trouvé', 404);

  await prisma.segmentClient.upsert({
    where: { segmentId_clientId: { segmentId, clientId: bc.id } },
    create: { segmentId, clientId: bc.id },
    update: {},
  });
}

export async function removeClientFromSegment(businessId: string, clientId: string, segmentId: string) {
  const bc = await ensureBusinessClient(businessId, clientId);
  const segment = await prisma.clientSegment.findFirst({ where: { id: segmentId, businessId } });
  if (!segment) throw new AppError('Segment non trouvé', 404);

  await prisma.segmentClient.deleteMany({
    where: { segmentId, clientId: bc.id },
  });
}

export async function recalculateSegment(businessId: string, segmentId: string) {
  const segment = await prisma.clientSegment.findFirst({
    where: { id: segmentId, businessId, isDynamic: true },
  });
  if (!segment) throw new AppError('Segment non trouvé ou non dynamique', 404);

  const conditions = segment.conditions as Record<string, any> | null;
  if (!conditions) return;

  const where: Prisma.BusinessClientWhereInput = { businessId, isActive: true };

  if (conditions.minOrders) {
    where.totalOrders = { gte: conditions.minOrders };
  }
  if (conditions.minSpent) {
    where.totalSpent = { gte: conditions.minSpent };
  }
  if (conditions.maxSpent) {
    where.totalSpent = { ...(where.totalSpent as any || {}), lte: conditions.maxSpent };
  }
  if (conditions.lastOrderDays) {
    const since = new Date();
    since.setDate(since.getDate() - conditions.lastOrderDays);
    where.lastOrderAt = { gte: since };
  }

  const matchingClients = await prisma.businessClient.findMany({
    where,
    select: { id: true },
  });

  const matchingIds = matchingClients.map((c) => c.id);

  await prisma.$transaction(async (tx) => {
    await tx.segmentClient.deleteMany({ where: { segmentId } });
    if (matchingIds.length > 0) {
      await tx.segmentClient.createMany({
        data: matchingIds.map((clientId) => ({ segmentId, clientId })),
      });
    }
  });

  return { assigned: matchingIds.length };
}

export async function getCrmDashboardStats(businessId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalClients,
    newClients30d,
    clientsToday,
    activeClients,
    totalSegments,
    totalTags,
    totalNotes,
    avgOrdersPerClient,
    clientsWithDebt,
    topClients,
    recentActivity,
  ] = await Promise.all([
    prisma.businessClient.count({ where: { businessId } }),
    prisma.businessClient.count({
      where: { businessId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.businessClient.count({
      where: { businessId, createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.businessClient.count({
      where: { businessId, isActive: true, lastOrderAt: { gte: thirtyDaysAgo } },
    }),
    prisma.clientSegment.count({ where: { businessId } }),
    prisma.businessTag.count({ where: { businessId } }),
    prisma.clientNote.count({
      where: { businessClient: { businessId } },
    }),
    prisma.businessClient.aggregate({
      where: { businessId },
      _avg: { totalOrders: true },
    }),
    prisma.clientRisk.count({
      where: { businessId, blacklisted: false, riskLevel: { in: ['MEDIUM', 'HIGH', 'CRITICAL'] } },
    }),
    prisma.businessClient.findMany({
      where: { businessId, isActive: true },
      orderBy: { totalSpent: 'desc' },
      take: 5,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    }),
    prisma.clientNote.findMany({
      where: { businessClient: { businessId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        businessClient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            client: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    }),
  ]);

  return {
    totalClients,
    newClients30d,
    clientsToday,
    activeClients,
    inactiveClients: totalClients - activeClients,
    totalSegments,
    totalTags,
    totalNotes,
    avgOrdersPerClient: avgOrdersPerClient._avg.totalOrders || 0,
    clientsWithDebt,
    retentionRate: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0,
    topClients: topClients.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      firstName: c.firstName || c.client.firstName,
      lastName: c.lastName || c.client.lastName,
      avatar: c.client.avatar,
      totalSpent: Number(c.totalSpent),
      totalOrders: c.totalOrders,
    })),
    recentActivity: recentActivity.map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt,
      createdBy: n.createdBy,
      client: {
        id: n.businessClient.id,
        firstName: n.businessClient.firstName || n.businessClient.client.firstName,
        lastName: n.businessClient.lastName || n.businessClient.client.lastName,
        avatar: n.businessClient.client.avatar,
      },
    })),
  };
}

export async function syncClientFromOrder(businessId: string, clientId: string, orderTotal: number) {
  const bc = await prisma.businessClient.upsert({
    where: { businessId_clientId: { businessId, clientId } },
    create: { businessId, clientId, totalOrders: 1, totalSpent: orderTotal, lastOrderAt: new Date(), lastVisitAt: new Date(), visitCount: 1 },
    update: {
      totalOrders: { increment: 1 },
      totalSpent: { increment: orderTotal },
      lastOrderAt: new Date(),
      lastVisitAt: new Date(),
      visitCount: { increment: 1 },
    },
  });
  return bc;
}

export async function syncClientVisit(businessId: string, clientId: string) {
  const bc = await ensureBusinessClient(businessId, clientId);
  return prisma.businessClient.update({
    where: { id: bc.id },
    data: { lastVisitAt: new Date(), visitCount: { increment: 1 } },
  });
}

export async function deleteClientNote(businessId: string, noteId: string) {
  const note = await prisma.clientNote.findFirst({
    where: { id: noteId, businessClient: { businessId } },
  });
  if (!note) throw new AppError('Note non trouvée', 404);
  await prisma.clientNote.delete({ where: { id: noteId } });
}

export async function updateClientNote(businessId: string, noteId: string, content: string) {
  const note = await prisma.clientNote.findFirst({
    where: { id: noteId, businessClient: { businessId } },
  });
  if (!note) throw new AppError('Note non trouvée', 404);
  return prisma.clientNote.update({
    where: { id: noteId },
    data: { content },
  });
}
