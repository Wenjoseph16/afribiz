import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function getClientDashboardData(userId: string) {
  const [
    ordersCount,
    ordersInProgress,
    bookingsCount,
    upcomingBookings,
    paymentsPending,
    paymentsCompleted,
    favoritesCount,
    loyaltyPoints,
    unreadNotifications,
  ] = await Promise.all([
    prisma.order.count({ where: { buyerId: userId } }),
    prisma.order.count({
      where: { buyerId: userId, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED'] } },
    }),
    prisma.booking.count({ where: { clientId: userId } }),
    prisma.booking.count({
      where: {
        clientId: userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { gte: new Date() },
      },
    }),
    prisma.payment.count({ where: { userId, status: 'PENDING' } }),
    prisma.payment.count({ where: { userId, status: 'COMPLETED' } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.loyaltyPoints.findMany({ where: { clientId: userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  const totalLoyaltyPoints = loyaltyPoints.reduce((sum, lp) => sum + lp.totalPoints, 0);

  return {
    orders: { total: ordersCount, inProgress: ordersInProgress },
    bookings: { total: bookingsCount, upcoming: upcomingBookings },
    payments: { pending: paymentsPending, completed: paymentsCompleted },
    favorites: { count: favoritesCount },
    loyalty: { points: totalLoyaltyPoints },
    notifications: { unread: unreadNotifications },
  };
}

export async function getBusinessDashboardData(userId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!business) {
    throw new AppError('Business not found for this user', 404);
  }

  const { getAggregatedDashboardStats, getMyBusinessStats } = await import('../services/business');

  const [aggregated, stats] = await Promise.all([
    getAggregatedDashboardStats(business.id),
    getMyBusinessStats(business.id),
  ]);

  return {
    businessId: business.id,
    ...aggregated,
    ...stats,
  };
}

export async function getDeveloperDashboardData(userId: string) {
  const devProfile = await prisma.developerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!devProfile) {
    throw new AppError('Developer profile not found', 404);
  }

  const { getDeveloperDashboard } = await import('../services/developer');
  return getDeveloperDashboard(devProfile.id);
}

export async function getAdminDashboardData() {
  const { getDashboardStats } = await import('../services/adminService');
  return getDashboardStats();
}
