import { prisma } from '../lib/db';
import {
  TransactionSnapshot,
  TransactionListResponse,
  TransactionStats,
  TransactionFilters,
  TransactionType,
  TRANSACTION_STATUS_LABELS,
  STATUS_PROGRESS,
} from '../types/tracking';
import { logger } from '../lib/logger';

// ============================================
// Tracking Service — Unified transaction view
// ============================================

const TYPE_QUERIES: Record<
  TransactionType,
  (userId: string, filters: TransactionFilters) => Promise<TransactionSnapshot[]>
> = {
  ORDER: fetchOrders,
  BOOKING: fetchBookings,
  RENTAL: fetchRentals,
  EVENT: fetchEvents,
  SUBSCRIPTION: fetchSubscriptions,
  TRAINING: fetchTrainings,
  LAYAWAY: fetchLayaways,
};

export async function getUnifiedTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionListResponse> {
  const types =
    filters.types ||
    ([
      'ORDER',
      'BOOKING',
      'RENTAL',
      'EVENT',
      'SUBSCRIPTION',
      'TRAINING',
      'LAYAWAY',
    ] as TransactionType[]);
  const limit = filters.limit || 20;
  const page = filters.page || 1;
  const skip = (page - 1) * limit;

  const allTransactions: TransactionSnapshot[] = [];

  for (const type of types) {
    try {
      const items = await TYPE_QUERIES[type](userId, filters);
      allTransactions.push(...items);
    } catch (err) {
      logger.error(`Error fetching ${type} transactions:`, err);
    }
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    const filtered = allTransactions.filter(
      (t) =>
        t.number.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.subtitle && t.subtitle.toLowerCase().includes(q))
    );
    allTransactions.length = 0;
    allTransactions.push(...filtered);
  }

  allTransactions.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const stats = await getTransactionStats(userId);
  const total = allTransactions.length;
  const paged = allTransactions.slice(skip, skip + limit);

  return {
    transactions: paged,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats,
  };
}

export async function getUnifiedTransaction(
  userId: string,
  type: TransactionType,
  id: string
): Promise<TransactionSnapshot | null> {
  switch (type) {
    case 'ORDER':
      return fetchOrderDetail(userId, id);
    case 'BOOKING':
      return fetchBookingDetail(userId, id);
    case 'EVENT':
      return fetchEventDetail(userId, id);
    case 'SUBSCRIPTION':
      return fetchSubscriptionDetail(userId, id);
    case 'TRAINING':
      return fetchTrainingDetail(userId, id);
    case 'LAYAWAY':
      return fetchLayawayDetail(userId, id);
    case 'RENTAL':
      return fetchRentalDetail(userId, id);
    default:
      return null;
  }
}

async function getTransactionStats(userId: string): Promise<TransactionStats> {
  const [orders, bookings, rentals, events, subscriptions, trainings, layaways] = await Promise.all(
    [
      prisma.order.findMany({ where: { buyerId: userId, deletedAt: null } }),
      prisma.booking.findMany({ where: { clientId: userId, deletedAt: null } }),
      prisma.booking.findMany({ where: { clientId: userId, type: 'RESOURCE', deletedAt: null } }),
      prisma.eventParticipant.findMany({ where: { clientId: userId } }),
      prisma.businessSubscription.findMany({ where: { clientId: userId } }),
      prisma.userTraining.findMany({ where: { userId } }),
      prisma.layawayPlan.findMany({ where: { clientId: userId } }),
    ]
  );

  const activeStatuses = [
    'PENDING',
    'CONFIRMED',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'DELIVERING',
    'ACTIVE',
    'IN_PROGRESS',
    'REGISTERED',
    'NOT_STARTED',
  ];
  const cancelledStatuses = ['CANCELLED', 'REFUSED', 'REFUNDED', 'EXPIRED', 'NO_SHOW'];
  const completedStatuses = ['DELIVERED', 'COMPLETED', 'RETURNED', 'ATTENDED'];

  const countByStatus = (items: { status: string }[]) => ({
    active: items.filter((i) => activeStatuses.includes(i.status)).length,
    completed: items.filter((i) => completedStatuses.includes(i.status)).length,
    cancelled: items.filter((i) => cancelledStatuses.includes(i.status)).length,
    pending: items.filter((i) => i.status === 'PENDING').length,
  });

  const orderStats = countByStatus(orders as { status: string }[]);
  const bookingStats = countByStatus(bookings as { status: string }[]);
  const eventStats = countByStatus(
    events.map((e) => ({ status: e.status })) as { status: string }[]
  );
  const subStats = countByStatus(subscriptions as { status: string }[]);
  const trainingStats = countByStatus(trainings as { status: string }[]);
  const layawayStats = countByStatus(layaways as { status: string }[]);

  const total =
    orders.length +
    bookings.length +
    events.length +
    subscriptions.length +
    trainings.length +
    layaways.length;

  return {
    total,
    active:
      orderStats.active +
      bookingStats.active +
      eventStats.active +
      subStats.active +
      trainingStats.active +
      layawayStats.active,
    completed:
      orderStats.completed +
      bookingStats.completed +
      eventStats.completed +
      subStats.completed +
      trainingStats.completed +
      layawayStats.completed,
    cancelled:
      orderStats.cancelled +
      bookingStats.cancelled +
      eventStats.cancelled +
      subStats.cancelled +
      trainingStats.cancelled +
      layawayStats.cancelled,
    pending:
      orderStats.pending +
      bookingStats.pending +
      eventStats.pending +
      subStats.pending +
      trainingStats.pending +
      layawayStats.pending,
    totalAmount: 0,
    byType: {
      ORDER: orders.length,
      BOOKING: bookings.length,
      RENTAL: rentals.length,
      EVENT: events.length,
      SUBSCRIPTION: subscriptions.length,
      TRAINING: trainings.length,
      LAYAWAY: layaways.length,
    },
  };
}

// ============================================
// Per-type fetchers
// ============================================

function buildTimeline(
  status: string,
  type: TransactionType
): { id: string; type: string; label: string; timestamp: string; isCurrent: boolean }[] {
  const statuses = Object.keys(TRANSACTION_STATUS_LABELS[type] || {});
  const currentIdx = statuses.indexOf(status);
  return statuses.slice(0, currentIdx + 1).map((s, i) => ({
    id: `${type.toLowerCase()}-${s.toLowerCase()}`,
    type: s,
    label: TRANSACTION_STATUS_LABELS[type]?.[s] || s,
    timestamp: new Date(Date.now() - (currentIdx - i) * 3600000).toISOString(),
    isCurrent: s === status,
  }));
}

async function fetchOrders(
  userId: string,
  filters: TransactionFilters
): Promise<TransactionSnapshot[]> {
  const where: any = { buyerId: userId, deletedAt: null };
  if (filters.statuses?.length) where.status = { in: filters.statuses };

  const orders = await prisma.order.findMany({
    where,
    include: { items: true, business: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return orders.map((o) => {
    const statusLabel = TRANSACTION_STATUS_LABELS.ORDER?.[o.status] || o.status;
    const progress = STATUS_PROGRESS.ORDER?.[o.status] || 0;
    return {
      id: o.id,
      type: 'ORDER' as TransactionType,
      number: o.orderNumber,
      title: `Commande #${o.orderNumber}`,
      subtitle: o.items.length > 0 ? o.items.map((i) => i.name).join(', ') : undefined,
      status: o.status,
      statusLabel,
      amount: Number(o.totalAmount),
      currency: o.currency,
      progress,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      deliveredAt: o.deliveredAt?.toISOString(),
      business: o.business
        ? { id: o.business.id, name: o.business.name, slug: o.business.slug }
        : undefined,
      items: o.items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
      timeline: buildTimeline(o.status, 'ORDER'),
      meta: {
        type: o.type,
        deliveryAddress: o.deliveryAddress,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        deliveryStatus: o.deliveryStatus,
      },
    };
  });
}

async function fetchBookings(
  userId: string,
  filters: TransactionFilters
): Promise<TransactionSnapshot[]> {
  const where: any = { clientId: userId, deletedAt: null };
  if (filters.statuses?.length) where.status = { in: filters.statuses };

  const bookings = await prisma.booking.findMany({
    where,
    include: { business: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return bookings.map((b) => {
    const statusLabel = TRANSACTION_STATUS_LABELS.BOOKING?.[b.status] || b.status;
    return {
      id: b.id,
      type: 'BOOKING' as TransactionType,
      number: b.bookingNumber,
      title: b.title,
      subtitle: b.description || undefined,
      status: b.status,
      statusLabel,
      amount: Number(b.price),
      currency: b.currency,
      progress: STATUS_PROGRESS.BOOKING?.[b.status] || 0,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      expiresAt: b.endDate?.toISOString(),
      business: b.business
        ? { id: b.business.id, name: b.business.name, slug: b.business.slug }
        : undefined,
      timeline: buildTimeline(b.status, 'BOOKING'),
      meta: { type: b.type, startDate: b.startDate?.toISOString(), guests: b.guests },
    };
  });
}

async function fetchBookingDetail(userId: string, id: string) {
  const booking = await prisma.booking.findFirst({
    where: { id, clientId: userId, deletedAt: null },
    include: { business: { select: { id: true, name: true, slug: true } } },
  });
  if (!booking) return null;
  const statusLabel = TRANSACTION_STATUS_LABELS.BOOKING?.[booking.status] || booking.status;
  return {
    id: booking.id,
    type: 'BOOKING' as TransactionType,
    number: booking.bookingNumber,
    title: booking.title,
    subtitle: booking.description || undefined,
    status: booking.status,
    statusLabel,
    amount: Number(booking.price),
    currency: booking.currency,
    progress: STATUS_PROGRESS.BOOKING?.[booking.status] || 0,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    expiresAt: booking.endDate?.toISOString(),
    business: booking.business
      ? { id: booking.business.id, name: booking.business.name, slug: booking.business.slug }
      : undefined,
    timeline: buildTimeline(booking.status, 'BOOKING'),
    meta: {
      type: booking.type,
      startDate: booking.startDate?.toISOString(),
      guests: booking.guests,
    },
  };
}

async function fetchRentals(
  userId: string,
  filters: TransactionFilters
): Promise<TransactionSnapshot[]> {
  const bookings = await prisma.booking.findMany({
    where: { clientId: userId, type: 'RESOURCE', deletedAt: null },
    include: { business: { select: { id: true, name: true, slug: true } }, rental: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return bookings.map((b) => {
    const statusLabel = TRANSACTION_STATUS_LABELS.RENTAL?.[b.status] || b.status;
    return {
      id: b.id,
      type: 'RENTAL' as TransactionType,
      number: b.bookingNumber,
      title: b.rental?.name || b.title,
      subtitle: b.rental?.description || undefined,
      status: b.status,
      statusLabel,
      amount: Number(b.price),
      currency: b.currency,
      progress: STATUS_PROGRESS.RENTAL?.[b.status] || 0,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      expiresAt: b.endDate?.toISOString(),
      business: b.business
        ? { id: b.business.id, name: b.business.name, slug: b.business.slug }
        : undefined,
      timeline: buildTimeline(b.status, 'RENTAL'),
      meta: {
        rentalId: b.rentalId,
        startDate: b.startDate?.toISOString(),
        endDate: b.endDate?.toISOString(),
      },
    };
  });
}

async function fetchRentalDetail(userId: string, id: string) {
  const booking = await prisma.booking.findFirst({
    where: { id, clientId: userId, type: 'RESOURCE', deletedAt: null },
    include: { business: { select: { id: true, name: true, slug: true } }, rental: true },
  });
  if (!booking) return null;
  const statusLabel = TRANSACTION_STATUS_LABELS.RENTAL?.[booking.status] || booking.status;
  return {
    id: booking.id,
    type: 'RENTAL' as TransactionType,
    number: booking.bookingNumber,
    title: booking.rental?.name || booking.title,
    subtitle: booking.rental?.description || undefined,
    status: booking.status,
    statusLabel,
    amount: Number(booking.price),
    currency: booking.currency,
    progress: STATUS_PROGRESS.RENTAL?.[booking.status] || 0,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    expiresAt: booking.endDate?.toISOString(),
    business: booking.business
      ? { id: booking.business.id, name: booking.business.name, slug: booking.business.slug }
      : undefined,
    timeline: buildTimeline(booking.status, 'RENTAL'),
    meta: {
      rentalId: booking.rentalId,
      startDate: booking.startDate?.toISOString(),
      endDate: booking.endDate?.toISOString(),
    },
  };
}

async function fetchEvents(
  userId: string,
  filters: TransactionFilters
): Promise<TransactionSnapshot[]> {
  const participants = await prisma.eventParticipant.findMany({
    where: { clientId: userId },
    include: {
      event: { include: { business: { select: { id: true, name: true, slug: true } } } },
      ticket: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return participants
    .filter((p) => p.event)
    .map((p) => {
      const statusLabel = TRANSACTION_STATUS_LABELS.EVENT?.[p.status] || p.status;
      return {
        id: p.id,
        type: 'EVENT' as TransactionType,
        number: p.ticketRef,
        title: p.event!.title,
        subtitle: p.ticket?.name || undefined,
        status: p.status,
        statusLabel,
        amount: p.price ? Number(p.price) : 0,
        currency: p.currency,
        progress: STATUS_PROGRESS.EVENT?.[p.status] || 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        expiresAt: p.event!.endDate?.toISOString(),
        business: p.event!.business
          ? { id: p.event!.business.id, name: p.event!.business.name, slug: p.event!.business.slug }
          : undefined,
        timeline: buildTimeline(p.status, 'EVENT'),
        meta: {
          eventId: p.event!.id,
          ticketType: p.ticketType,
          qrCode: p.qrCode,
          startDate: p.event!.startDate?.toISOString(),
        },
      };
    });
}

async function fetchEventDetail(userId: string, id: string) {
  const participant = await prisma.eventParticipant.findFirst({
    where: { id, clientId: userId },
    include: {
      event: { include: { business: { select: { id: true, name: true, slug: true } } } },
      ticket: true,
    },
  });
  if (!participant) return null;
  const statusLabel = TRANSACTION_STATUS_LABELS.EVENT?.[participant.status] || participant.status;
  return {
    id: participant.id,
    type: 'EVENT' as TransactionType,
    number: participant.ticketRef,
    title: participant.event!.title,
    subtitle: participant.ticket?.name || undefined,
    status: participant.status,
    statusLabel,
    amount: participant.price ? Number(participant.price) : 0,
    currency: participant.currency,
    progress: STATUS_PROGRESS.EVENT?.[participant.status] || 0,
    createdAt: participant.createdAt.toISOString(),
    updatedAt: participant.updatedAt.toISOString(),
    expiresAt: participant.event!.endDate?.toISOString(),
    business: participant.event!.business
      ? {
          id: participant.event!.business.id,
          name: participant.event!.business.name,
          slug: participant.event!.business.slug,
        }
      : undefined,
    timeline: buildTimeline(participant.status, 'EVENT'),
    meta: {
      eventId: participant.event!.id,
      ticketType: participant.ticketType,
      qrCode: participant.qrCode,
      qrData: participant.qrData,
      startDate: participant.event!.startDate?.toISOString(),
      location: participant.event!.address,
    },
  };
}

async function fetchSubscriptions(
  userId: string,
  filters: TransactionFilters
): Promise<TransactionSnapshot[]> {
  const subs = await prisma.businessSubscription.findMany({
    where: { clientId: userId },
    include: {
      plan: true,
      business: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return subs.map((s) => {
    const statusLabel = TRANSACTION_STATUS_LABELS.SUBSCRIPTION?.[s.status] || s.status;
    return {
      id: s.id,
      type: 'SUBSCRIPTION' as TransactionType,
      number: s.id.slice(0, 8).toUpperCase(),
      title: s.plan.name,
      subtitle: s.plan.description || undefined,
      status: s.status,
      statusLabel,
      amount: Number(s.plan.price),
      currency: s.plan.currency,
      progress: STATUS_PROGRESS.SUBSCRIPTION?.[s.status] || 0,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      expiresAt: s.endDate?.toISOString(),
      business: { id: s.business.id, name: s.business.name, slug: s.business.slug },
      timeline: buildTimeline(s.status, 'SUBSCRIPTION'),
      meta: {
        billingCycle: s.plan.billingCycle,
        nextBillingDate: s.nextBillingDate?.toISOString(),
        autoRenew: s.autoRenew,
      },
    };
  });
}

async function fetchSubscriptionDetail(userId: string, id: string) {
  const sub = await prisma.businessSubscription.findFirst({
    where: { id, clientId: userId },
    include: {
      plan: true,
      business: { select: { id: true, name: true, slug: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!sub) return null;
  const statusLabel = TRANSACTION_STATUS_LABELS.SUBSCRIPTION?.[sub.status] || sub.status;
  return {
    id: sub.id,
    type: 'SUBSCRIPTION' as TransactionType,
    number: sub.id.slice(0, 8).toUpperCase(),
    title: sub.plan.name,
    subtitle: sub.plan.description || undefined,
    status: sub.status,
    statusLabel,
    amount: Number(sub.plan.price),
    currency: sub.plan.currency,
    progress: STATUS_PROGRESS.SUBSCRIPTION?.[sub.status] || 0,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
    expiresAt: sub.endDate?.toISOString(),
    business: { id: sub.business.id, name: sub.business.name, slug: sub.business.slug },
    timeline: buildTimeline(sub.status, 'SUBSCRIPTION'),
    meta: {
      billingCycle: sub.plan.billingCycle,
      nextBillingDate: sub.nextBillingDate?.toISOString(),
      autoRenew: sub.autoRenew,
      benefits: sub.plan.benefits,
      payments: sub.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        method: p.method,
        createdAt: p.createdAt.toISOString(),
      })),
    },
  };
}

async function fetchTrainings(
  userId: string,
  filters: TransactionFilters
): Promise<TransactionSnapshot[]> {
  const trainings = await prisma.userTraining.findMany({
    where: { userId },
    include: {
      training: { include: { business: { select: { id: true, name: true, slug: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return trainings
    .filter((t) => t.training)
    .map((t) => {
      const statusLabel = TRANSACTION_STATUS_LABELS.TRAINING?.[t.status] || t.status;
      return {
        id: t.id,
        type: 'TRAINING' as TransactionType,
        number: t.id.slice(0, 8).toUpperCase(),
        title: t.training!.title,
        subtitle: t.training!.category || undefined,
        status: t.status,
        statusLabel,
        amount: t.training!.price ? Number(t.training!.price) : 0,
        currency: 'FCFA',
        progress: t.progress || STATUS_PROGRESS.TRAINING?.[t.status] || 0,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        business: t.training!.business
          ? {
              id: t.training!.business.id,
              name: t.training!.business.name,
              slug: t.training!.business.slug,
            }
          : undefined,
        timeline: buildTimeline(t.status, 'TRAINING'),
        meta: {
          trainingId: t.trainingId,
          certificateUrl: t.certificateUrl,
          lessons: t.training!.lessons,
        },
      };
    });
}

async function fetchTrainingDetail(userId: string, id: string) {
  const training = await prisma.userTraining.findFirst({
    where: { id, userId },
    include: {
      training: {
        include: {
          business: { select: { id: true, name: true, slug: true } },
          TrainingLesson: true,
        },
      },
    },
  });
  if (!training || !training.training) return null;
  const statusLabel = TRANSACTION_STATUS_LABELS.TRAINING?.[training.status] || training.status;
  return {
    id: training.id,
    type: 'TRAINING' as TransactionType,
    number: training.id.slice(0, 8).toUpperCase(),
    title: training.training.title,
    subtitle: training.training.category || undefined,
    status: training.status,
    statusLabel,
    amount: training.training.price ? Number(training.training.price) : 0,
    currency: 'FCFA',
    progress: training.progress || STATUS_PROGRESS.TRAINING?.[training.status] || 0,
    createdAt: training.createdAt.toISOString(),
    updatedAt: training.updatedAt.toISOString(),
    business: training.training.business
      ? {
          id: training.training.business.id,
          name: training.training.business.name,
          slug: training.training.business.slug,
        }
      : undefined,
    timeline: buildTimeline(training.status, 'TRAINING'),
    meta: {
      trainingId: training.trainingId,
      certificateUrl: training.certificateUrl,
      lessons: training.training.TrainingLesson?.length,
    },
  };
}

async function fetchLayaways(
  userId: string,
  filters: TransactionFilters
): Promise<TransactionSnapshot[]> {
  const plans = await prisma.layawayPlan.findMany({
    where: { clientId: userId },
    include: { contributions: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return plans.map((p) => {
    const statusLabel = TRANSACTION_STATUS_LABELS.LAYAWAY?.[p.status] || p.status;
    const progress = p.targetAmount.gt(0)
      ? Math.min(100, Math.round((Number(p.savedAmount) / Number(p.targetAmount)) * 100))
      : 0;
    return {
      id: p.id,
      type: 'LAYAWAY' as TransactionType,
      number: p.id.slice(0, 8).toUpperCase(),
      title: p.itemName,
      subtitle: `Épargne ${p.contributions.length} versement${p.contributions.length > 1 ? 's' : ''}`,
      status: p.status,
      statusLabel,
      amount: Number(p.targetAmount),
      currency: 'FCFA',
      progress,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      expiresAt: p.expiresAt?.toISOString(),
      timeline: [
        {
          id: 'lay-start',
          type: 'STARTED',
          label: 'Plan créé',
          timestamp: p.startedAt.toISOString(),
          isCurrent: false,
        },
        ...p.contributions.map((c) => ({
          id: c.id,
          type: 'CONTRIBUTION',
          label: `Versement ${Number(c.amount)} FCFA`,
          timestamp: c.createdAt.toISOString(),
          isCurrent: false,
        })),
        {
          id: 'lay-current',
          type: p.status,
          label: statusLabel,
          timestamp: p.updatedAt.toISOString(),
          isCurrent: true,
        },
      ],
      meta: {
        savedAmount: Number(p.savedAmount),
        targetAmount: Number(p.targetAmount),
        durationDays: p.durationDays,
      },
    };
  });
}

async function fetchLayawayDetail(userId: string, id: string) {
  const plan = await prisma.layawayPlan.findFirst({
    where: { id, clientId: userId },
    include: { contributions: { orderBy: { createdAt: 'desc' } } },
  });
  if (!plan) return null;
  const statusLabel = TRANSACTION_STATUS_LABELS.LAYAWAY?.[plan.status] || plan.status;
  const progress = plan.targetAmount.gt(0)
    ? Math.min(100, Math.round((Number(plan.savedAmount) / Number(plan.targetAmount)) * 100))
    : 0;
  return {
    id: plan.id,
    type: 'LAYAWAY' as TransactionType,
    number: plan.id.slice(0, 8).toUpperCase(),
    title: plan.itemName,
    subtitle: `${plan.contributions.length} versement${plan.contributions.length > 1 ? 's' : ''}`,
    status: plan.status,
    statusLabel,
    amount: Number(plan.targetAmount),
    currency: 'FCFA',
    progress,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    expiresAt: plan.expiresAt?.toISOString(),
    timeline: [
      {
        id: 'lay-start',
        type: 'STARTED',
        label: 'Plan créé',
        timestamp: plan.startedAt.toISOString(),
        isCurrent: false,
      },
      ...plan.contributions.map((c) => ({
        id: c.id,
        type: 'CONTRIBUTION',
        label: `Versement ${Number(c.amount)} FCFA`,
        timestamp: c.createdAt.toISOString(),
        isCurrent: false,
      })),
      {
        id: 'lay-current',
        type: plan.status,
        label: statusLabel,
        timestamp: plan.updatedAt.toISOString(),
        isCurrent: true,
      },
    ],
    meta: {
      savedAmount: Number(plan.savedAmount),
      targetAmount: Number(plan.targetAmount),
      durationDays: plan.durationDays,
      contributions: plan.contributions.map((c) => ({
        id: c.id,
        amount: Number(c.amount),
        method: c.method,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
    },
  };
}

async function fetchOrderDetail(userId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, buyerId: userId, deletedAt: null },
    include: { items: true, business: { select: { id: true, name: true, slug: true } } },
  });
  if (!order) return null;
  const statusLabel = TRANSACTION_STATUS_LABELS.ORDER?.[order.status] || order.status;
  const progress = STATUS_PROGRESS.ORDER?.[order.status] || 0;
  return {
    id: order.id,
    type: 'ORDER' as TransactionType,
    number: order.orderNumber,
    title: `Commande #${order.orderNumber}`,
    subtitle: order.items.length > 0 ? order.items.map((i) => i.name).join(', ') : undefined,
    status: order.status,
    statusLabel,
    amount: Number(order.totalAmount),
    currency: order.currency,
    progress,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    business: order.business
      ? { id: order.business.id, name: order.business.name, slug: order.business.slug }
      : undefined,
    items: order.items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      total: Number(i.total),
    })),
    timeline: buildTimeline(order.status, 'ORDER'),
    meta: {
      type: order.type,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryStatus: order.deliveryStatus,
    },
  };
}
