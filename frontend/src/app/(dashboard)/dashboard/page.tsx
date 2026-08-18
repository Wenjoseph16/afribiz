'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Calendar,
  Wallet,
  Bell,
  Heart,
  ArrowUpRight,
  Sparkles,
  Car,
  Shield,
  Percent,
  Star,
  Award,
  TrendingUp,
  Clock,
  Gift,
  Zap,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ProfileCompletionBar } from '@/components/dashboard/ProfileCompletionBar';
import { cn } from '@/lib/utils';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useAuthStore } from '@/stores/authStore';
import {
  useOrders,
  useBookings,
  usePayments,
  useFavorites,
  useNotifications,
} from '@/features/hooks';
import AdSlot from '@/components/ads/AdSlot';
import { apiClient } from '@/services/apiClient';
import { Loader } from '@/components/ui/Loader';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { CopilotDashboardBrief } from '@/components/copilot/CopilotDashboardBrief';
import { CashWidget } from '@/components/dashboard/CashWidget';
import { buildDashboardWorkflowState } from '@/lib/dashboardWorkflow';
import { buildLaunchJourneyState } from '@/lib/launchJourney';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }
  if (!isAuthenticated() || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return <ClientDashboardContent />;
}

function ClientDashboardContent() {
  const { user: authUser } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('recommended');

  const STATUS_STYLES: Record<
    string,
    { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }
  > = {
    DELIVERED: { label: 'Livrée', variant: 'success' },
    COMPLETED: { label: 'Terminée', variant: 'success' },
    PENDING: { label: 'En attente', variant: 'warning' },
    PROCESSING: { label: 'En cours', variant: 'info' },
    CONFIRMED: { label: 'Confirmée', variant: 'success' },
    CANCELLED: { label: 'Annulée', variant: 'danger' },
    REFUNDED: { label: 'Remboursée', variant: 'info' },
  };

  const { data: ordersData } = useOrders({ limit: 5 });
  const { data: bookingsData } = useBookings({ limit: 5 });
  const { data: paymentsData } = usePayments({ limit: 5 });
  const { data: favoritesData } = useFavorites();
  const { data: notificationsData } = useNotifications({ limit: 3 });

  const { data: loyaltyData } = useQuery({
    queryKey: ['loyalty-summary'],
    queryFn: async () => {
      const res = await apiClient.getMyLoyalty();
      return res.data.data;
    },
  });

  const { data: promosData } = useQuery({
    queryKey: ['available-promotions'],
    queryFn: async () => {
      const res = await apiClient.getAvailablePromotions();
      return res.data.data;
    },
  });

  const firstName = authUser?.firstName || 'Cher';
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  };

  const orders = useMemo(
    () => (Array.isArray(ordersData?.orders || ordersData) ? ordersData?.orders || ordersData : []),
    [ordersData]
  );
  const bookings = useMemo(
    () =>
      Array.isArray(bookingsData?.bookings || bookingsData)
        ? bookingsData?.bookings || bookingsData
        : [],
    [bookingsData]
  );
  const payments = useMemo(
    () =>
      Array.isArray(paymentsData?.transactions || paymentsData)
        ? paymentsData?.transactions || paymentsData
        : [],
    [paymentsData]
  );
  const favorites = useMemo(
    () =>
      Array.isArray(favoritesData?.favorites || favoritesData)
        ? favoritesData?.favorites || favoritesData
        : [],
    [favoritesData]
  );
  const notifications = useMemo(
    () =>
      Array.isArray(notificationsData?.notifications || notificationsData)
        ? notificationsData?.notifications || notificationsData
        : [],
    [notificationsData]
  );
  const promotions = useMemo(() => {
    const p = Array.isArray(promosData)
      ? promosData
      : promosData?.promotions || promosData?.items || [];
    return Array.isArray(p) ? p : [];
  }, [promosData]);
  const loyaltyPoints = loyaltyData?.points ?? 0;

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days: Array<{ number: number; isToday: boolean; isCurrentMonth: boolean }> = [];
    for (let i = startPad - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ number: prevDate.getDate(), isToday: false, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        number: i,
        isToday: i === now.getDate() && month === now.getMonth() && year === now.getFullYear(),
        isCurrentMonth: true,
      });
    }
    return days;
  }, []);

  const upcomingBookingsList = useMemo(
    () => bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING'),
    [bookings]
  );

  // Computed stats
  const ordersInProgress = orders.filter(
    (o: any) => !['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status)
  ).length;
  const upcomingBookings = bookings.filter(
    (b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING'
  ).length;
  const unreadNotifications = notifications.filter((n: any) => !n.read).length;
  const rentals = bookings.filter((b: any) =>
    ['RENTAL', 'VEHICLE', 'EQUIPMENT', 'SPACE'].includes(b.type)
  );
  const events = bookings.filter((b: any) =>
    ['EVENT', 'TRAINING', 'CONFERENCE', 'WORKSHOP'].includes(b.type)
  );
  const activeRentals = rentals.filter(
    (r: any) => r.status === 'ACTIVE' || r.status === 'CONFIRMED'
  ).length;
  const escrowsActive = 0; // Will come from backend
  const escrowsCompleted = 0;
  const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;

  const promoCategories = ['recommended', 'popular', 'new'];
  const workflowState = useMemo(
    () =>
      buildDashboardWorkflowState({
        orders,
        bookings,
        payments,
        promotions,
        notifications,
        loyaltyPoints,
      }),
    [bookings, loyaltyPoints, notifications, orders, payments, promotions]
  );

  const launchJourneyState = useMemo(
    () =>
      buildLaunchJourneyState({
        hasProfile: !!(authUser?.firstName && authUser?.lastName),
        hasPublicPage: !!authUser?.businessId,
        hasProducts: orders.length > 0,
        hasPayments: payments.length > 0,
        hasPromotions: promotions.length > 0,
      }),
    [
      authUser?.businessId,
      authUser?.firstName,
      authUser?.lastName,
      orders.length,
      payments.length,
      promotions.length,
    ]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-emerald-700 to-emerald-900 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-emerald-100 text-xs font-medium mb-3 border border-white/10">
              <Sparkles className="h-3 w-3" />
              Tableau de bord
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Bonjour, {firstName} 👋
            </h1>
            <p className="text-emerald-100/80 mt-1.5 text-sm sm:text-base">
              Bienvenue sur votre espace client AfriBiz
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LiveIndicator />
            <Link href="/marketplace">
              <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-50 shadow-lg shadow-black/10 transition-all duration-200 active:scale-[0.98]">
                Explorer le marketplace
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <CopilotDashboardBrief />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CashWidget />
        </div>
        <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-5 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                État du workflow
              </p>
              <h3 className="mt-1 text-xl font-display font-semibold text-gray-900 tracking-tight">
                Votre espace est à {workflowState.progressScore}% de son potentiel
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">{workflowState.healthMessage}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
                Prochaine priorité
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {workflowState.nextActions[0]?.title}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {workflowState.focusAreas.map((area) => (
              <div key={area.title} className="rounded-xl border border-gray-200 bg-white/80 p-3">
                <p className="text-sm font-semibold text-gray-900">{area.title}</p>
                <p className="mt-1 text-sm text-gray-600">{area.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Premier lancement
              </p>
              <h3 className="mt-1 text-xl font-display font-semibold text-slate-900 tracking-tight">
                {launchJourneyState.currentStep.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                {launchJourneyState.currentStep.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {launchJourneyState.progressScore}% prêt
              </div>
              <Link href={launchJourneyState.currentStep.href}>
                <Button size="sm">Continuer</Button>
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Profile completion */}
      <motion.div variants={itemVariants}>
        <ProfileCompletionBar percentage={65} />
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        aria-live="polite"
      >
        <StatsCard
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600"
          label="Commandes"
          value={ordersInProgress}
          trend={
            ordersInProgress > 0
              ? { value: `${ordersInProgress} en cours`, positive: true }
              : { value: `${orders.length} totale(s)`, positive: true }
          }
        />
        <StatsCard
          icon={<Calendar className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600"
          label="Réservations"
          value={upcomingBookings}
          trend={
            upcomingBookings > 0
              ? { value: `${upcomingBookings} à venir`, positive: true }
              : { value: `${bookings.length} totale(s)`, positive: true }
          }
        />
        <StatsCard
          icon={<Car className="h-5 w-5" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          iconColor="text-indigo-600"
          label="Locations"
          value={activeRentals}
          trend={
            activeRentals > 0
              ? { value: `${activeRentals} active(s)`, positive: true }
              : { value: `${rentals.length} totale(s)`, positive: true }
          }
        />
        <StatsCard
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          label="Paiements"
          value={pendingPayments}
          trend={
            pendingPayments > 0
              ? { value: `${pendingPayments} en attente`, positive: false }
              : { value: `${payments.length} effectué(s)`, positive: true }
          }
        />
        <StatsCard
          icon={<Shield className="h-5 w-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          label="Escrow"
          value={escrowsActive}
          trend={
            escrowsCompleted > 0
              ? { value: `${escrowsCompleted} terminé(s)`, positive: true }
              : undefined
          }
        />
        <StatsCard
          icon={<Heart className="h-5 w-5" />}
          iconBg="bg-red-50 dark:bg-red-900/30"
          iconColor="text-red-500"
          label="Favoris"
          value={favorites.length}
        />
        <StatsCard
          icon={<Award className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600"
          label="Points fidélité"
          value={loyaltyPoints.toLocaleString()}
          trend={loyaltyPoints > 0 ? { value: `${loyaltyPoints} pts`, positive: true } : undefined}
        />
        <StatsCard
          icon={<Bell className="h-5 w-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          label="Notifications"
          value={unreadNotifications}
          trend={
            unreadNotifications > 0
              ? { value: `${unreadNotifications} non lue(s)`, positive: false }
              : undefined
          }
        />
      </motion.div>

      {/* Mini Calendrier */}
      <motion.div variants={itemVariants}>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-900">Calendrier</h3>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="text-gray-400 font-medium py-1">
                {day}
              </div>
            ))}
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`py-1.5 rounded-full cursor-pointer hover:bg-brand/10 transition-colors ${
                  day.isToday ? 'bg-brand text-white hover:bg-brand-dark' : ''
                } ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'}`}
              >
                {day.number}
              </div>
            ))}
          </div>
          {upcomingBookingsList.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t pt-3">
              <p className="text-[10px] uppercase font-semibold text-gray-500">
                Réservations à venir
              </p>
              {upcomingBookingsList.slice(0, 3).map((b: any) => (
                <div key={b.id} className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                  <span className="truncate">
                    {b.serviceName || b.description || 'Réservation'}
                  </span>
                  <span className="text-gray-400 ml-auto shrink-0">
                    {new Date(b.startDate || b.date || b.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Sponsored banner */}
      <motion.div variants={itemVariants}>
        <AdSlot page="DASHBOARD_CLIENT" position="TOP_BANNER" />
      </motion.div>

      {/* Content grid - Row 1 */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <Card className="lg:col-span-2" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Dernières commandes
              </h3>
              {orders.length > 0 && (
                <Badge variant="brand" size="xs">
                  {orders.length}
                </Badge>
              )}
            </div>
            <Link
              href="/dashboard/orders"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {orders.length > 0 ? (
            <div className="space-y-2">
              {orders.slice(0, 5).map((order: any) => {
                const s = STATUS_STYLES[order.status] || {
                  label: order.status,
                  variant: 'default' as const,
                };
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShoppingBag className="h-4 w-4 text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Commande #{order.orderNumber?.slice(-6) || order.id?.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                              })
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {Number(order.totalAmount || 0).toLocaleString()} FCFA
                        </p>
                        <Badge variant={s.variant} size="xs">
                          {s.label}
                        </Badge>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<ShoppingBag className="h-8 w-8" />}
              title="Aucune commande"
              description="Vous n'avez pas encore passé de commande."
              action={
                <Link href="/marketplace">
                  <Button size="sm">Découvrir des produits</Button>
                </Link>
              }
            />
          )}
        </Card>

        {/* Notifications */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Notifications
              </h3>
              {unreadNotifications > 0 && (
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse-soft" />
              )}
            </div>
            <Link
              href="/dashboard/notifications"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notif: any) => (
                <div
                  key={notif.id}
                  onClick={() => notif.link && router.push(notif.link)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors',
                    notif.link ? 'cursor-pointer' : ''
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      notif.type === 'order'
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600'
                        : notif.type === 'payment'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                          : notif.type === 'booking'
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                            : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                    )}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{notif.title}</p>
                    {notif.description && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {notif.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {notif.createdAt
                        ? new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5 animate-pulse-soft" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Bell className="h-8 w-8" />}
              title="Aucune notification"
              description="Vous serez notifié ici lorsque quelque chose se produit."
            />
          )}
        </Card>

        {/* Sponsored sidebar */}
        <motion.div variants={itemVariants}>
          <AdSlot page="DASHBOARD_CLIENT" position="SIDEBAR" />
        </motion.div>
      </motion.div>

      {/* Row 2: Payments + Bookings + Promotions */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paiements en attente */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Paiements en attente
            </h3>
            <Link
              href="/dashboard/payments"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {payments.filter((p: any) => p.status === 'pending').length > 0 ? (
            <div className="space-y-2">
              {payments
                .filter((p: any) => p.status === 'pending')
                .slice(0, 3)
                .map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {p.description || 'Paiement'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">
                      {Number(p.amount || 0).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Aucun paiement en attente</p>
          )}
        </Card>

        {/* Réservations à venir */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Réservations à venir
            </h3>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING').length >
          0 ? (
            <div className="space-y-2">
              {bookings
                .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING')
                .slice(0, 3)
                .map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {b.serviceName || b.type || 'Réservation'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {b.businessName || b.business || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">
                        {b.date
                          ? new Date(b.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : ''}
                      </p>
                      <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'warning'} size="xs">
                        {b.status === 'CONFIRMED' ? 'Confirmée' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title="Aucune réservation"
              description="Réservez un service ou une table."
              action={
                <Link href="/marketplace">
                  <Button size="sm">Explorer</Button>
                </Link>
              }
            />
          )}
        </Card>

        {/* Promotions disponibles / Recommandations */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Promotions du jour
            </h3>
            <Link
              href="/dashboard/loyalty"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors flex items-center gap-1"
            >
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {promotions.length > 0 ? (
            <div className="space-y-2">
              {promotions.slice(0, 3).map((promo: any, i: number) => (
                <div
                  key={promo.id || i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-amber-200/50"
                >
                  <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 shrink-0">
                    <Percent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      {promo.title || 'Promotion'}
                    </p>
                    {promo.description && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {promo.description}
                      </p>
                    )}
                    {promo.code && (
                      <div className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-dashed border-gray-300">
                        <span className="text-[10px] font-mono font-bold">{promo.code}</span>
                      </div>
                    )}
                  </div>
                  <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Percent className="h-8 w-8" />}
              title="Aucune promotion"
              description="Les offres spéciales apparaîtront ici."
            />
          )}
        </Card>
      </motion.div>

      {/* Sponsored Card */}
      <motion.div variants={itemVariants}>
        <AdSlot page="DASHBOARD_CLIENT" position="SPONSORED_CARD" />
      </motion.div>

      {/* Row 3: Recommandations personnalisées */}
      <motion.div variants={itemVariants}>
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recommandé pour vous
              </h3>
            </div>
            <div className="flex gap-1">
              {promoCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors',
                    activeTab === cat
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  )}
                >
                  {cat === 'recommended'
                    ? 'Recommandé'
                    : cat === 'popular'
                      ? 'Populaire'
                      : 'Nouveautés'}
                </button>
              ))}
            </div>
          </div>
          {promotions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {promotions.slice(0, 4).map((promo: any, i: number) => (
                <div
                  key={promo.id || i}
                  className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-100 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand mb-2">
                    <Gift className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {promo.title || `Offre spéciale #${i + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {promo.businessName || promo.description || 'Découvrez cette offre'}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-[10px] font-medium text-emerald-600">Populaire</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              Pas de recommandations pour le moment. Explorez la marketplace pour découvrir des
              offres.
            </p>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
