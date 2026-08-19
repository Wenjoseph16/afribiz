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
import { EmptyState } from '@/components/dashboard/EmptyState';
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
import { apiClient } from '@/services/apiClient';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { LiveIndicator } from '@/components/ui/LiveIndicator';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) return <DashboardSkeleton />;
  if (!isAuthenticated() || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-white/40">Chargement...</p>
        </div>
      </div>
    );
  }

  return <ClientDashboardContent />;
}

function GlassCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('glass rounded-2xl glass-hover', className)} {...props}>
      {children}
    </div>
  );
}

function GlassLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn('text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1', className)}>
      {children}
    </Link>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />}
      <h3 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-[0.15em]">{children}</h3>
    </div>
  );
}

function ClientDashboardContent() {
  const { user: authUser } = useAuthStore();
  const router = useRouter();

  const STATUS_STYLES: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
    DELIVERED: { label: 'Livrée', variant: 'success' },
    COMPLETED: { label: 'Terminée', variant: 'success' },
    PENDING: { label: 'En attente', variant: 'warning' },
    PROCESSING: { label: 'En cours', variant: 'info' },
    CONFIRMED: { label: 'Confirmée', variant: 'success' },
    CANCELLED: { label: 'Annulée', variant: 'danger' },
    REFUNDED: { label: 'Remboursée', variant: 'info' },
  };

  const { data: ordersData } = useOrders({ limit: 100 });
  const { data: bookingsData } = useBookings({ limit: 50 });
  const { data: paymentsData } = usePayments({ limit: 5 });
  const { data: favoritesData } = useFavorites();
  const { data: notificationsData } = useNotifications({ limit: 3 });

  const { data: loyaltyData } = useQuery({
    queryKey: ['loyalty-summary'],
    queryFn: async () => { const res = await apiClient.getMyLoyalty(); return res.data.data; },
  });

  const { data: promosData } = useQuery({
    queryKey: ['available-promotions'],
    queryFn: async () => { const res = await apiClient.getAvailablePromotions(); return res.data.data; },
  });

  const firstName = authUser?.firstName || 'Cher';
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const orders = useMemo(() => (Array.isArray(ordersData?.orders || ordersData) ? ordersData?.orders || ordersData : []), [ordersData]);
  const bookings = useMemo(() => Array.isArray(bookingsData?.bookings || bookingsData) ? bookingsData?.bookings || bookingsData : [], [bookingsData]);
  const payments = useMemo(() => Array.isArray(paymentsData?.transactions || paymentsData) ? paymentsData?.transactions || paymentsData : [], [paymentsData]);
  const favorites = useMemo(() => Array.isArray(favoritesData?.favorites || favoritesData) ? favoritesData?.favorites || favoritesData : [], [favoritesData]);
  const notifications = useMemo(() => Array.isArray(notificationsData?.notifications || notificationsData) ? notificationsData?.notifications || notificationsData : [], [notificationsData]);
  const promotions = useMemo(() => { const p = Array.isArray(promosData) ? promosData : promosData?.promotions || promosData?.items || []; return Array.isArray(p) ? p : []; }, [promosData]);
  const loyaltyPoints = useMemo(() => { const pts = loyaltyData?.points; if (!Array.isArray(pts)) return 0; return pts.reduce((sum: number, p: any) => sum + (Number(p.totalPoints) || 0), 0); }, [loyaltyData]);

  const upcomingBookingsList = useMemo(() => bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING'), [bookings]);
  const ordersInProgress = orders.filter((o: any) => !['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status)).length;
  const upcomingBookings = bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING').length;
  const unreadNotifications = notifications.filter((n: any) => !n.read).length;
  const activeRentals = bookings.filter((b: any) => ['RENTAL', 'VEHICLE', 'EQUIPMENT', 'SPACE'].includes(b.type) && ['ACTIVE', 'CONFIRMED'].includes(b.status)).length;
  const pendingPayments = payments.filter((p: any) => p.status === 'pending').length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner — premium glass */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-emerald-100 text-[10px] font-semibold uppercase tracking-[0.15em] mb-3 border border-white/20">
              <Sparkles className="h-3 w-3" />
              Tableau de bord
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Bonjour, {firstName}
            </h1>
            <p className="text-emerald-100/70 mt-1.5 text-sm">
              Bienvenue sur votre espace client AfriBiz
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <LiveIndicator />
            <Link href="/marketplace">
              <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 shadow-lg shadow-black/10 transition-all duration-200 active:scale-[0.98]">
                Explorer
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Graphique des dépenses */}
      <motion.div variants={itemVariants}>
        <SpendingChart orders={orders} />
      </motion.div>

      {/* KPIs — bento asymmetric */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" aria-live="polite">
        <StatsCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Commandes"
          value={ordersInProgress}
          trend={ordersInProgress > 0 ? { value: `${ordersInProgress} en cours`, positive: true } : { value: `${orders.length} totale(s)`, positive: true }}
        />
        <StatsCard
          icon={<Calendar className="h-5 w-5" />}
          label="Réservations"
          value={upcomingBookings}
          trend={upcomingBookings > 0 ? { value: `${upcomingBookings} à venir`, positive: true } : { value: `${bookings.length} totale(s)`, positive: true }}
        />
        <StatsCard
          icon={<Car className="h-5 w-5" />}
          label="Locations"
          value={activeRentals}
        />
        <StatsCard
          icon={<Wallet className="h-5 w-5" />}
          label="Paiements"
          value={pendingPayments}
          trend={pendingPayments > 0 ? { value: `${pendingPayments} en attente`, positive: false } : undefined}
        />
        <StatsCard
          icon={<Award className="h-5 w-5" />}
          label="Points fidélité"
          value={loyaltyPoints.toLocaleString()}
          trend={loyaltyPoints > 0 ? { value: `${loyaltyPoints} pts`, positive: true } : undefined}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Content grid — bento */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders — spans 2 */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={ShoppingBag}>Dernières commandes</SectionTitle>
            <GlassLink href="/dashboard/orders">Voir tout <ArrowUpRight className="h-3 w-3" /></GlassLink>
          </div>
          {orders.length > 0 ? (
            <div className="space-y-2">
              {orders.slice(0, 5).map((order: any) => {
                const s = STATUS_STYLES[order.status] || { label: order.status, variant: 'default' as const };
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/20 transition-all duration-200 group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShoppingBag className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Commande #{order.orderNumber?.slice(-6) || order.id?.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white/30">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                          {Number(order.totalAmount || 0).toLocaleString()} FCFA
                        </p>
                        <span className={cn(
                          'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
                          s.variant === 'success' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                          s.variant === 'warning' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                          s.variant === 'danger' && 'bg-red-500/10 text-red-400 border-red-500/20',
                          s.variant === 'info' && 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}>
                          {s.label}
                        </span>
                      </div>
                      <ArrowUpRight className="h-4 h-4 text-gray-400 dark:text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-white/15 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-white/40">Aucune commande</p>
              <Link href="/marketplace" className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-400 hover:text-emerald-300">
                Explorer le marketplace <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </GlassCard>

        {/* Notifications */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SectionTitle icon={Bell}>Notifications</SectionTitle>
              {unreadNotifications > 0 && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />}
            </div>
            <GlassLink href="/dashboard/notifications">Tout</GlassLink>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notif: any) => (
                <div
                  key={notif.id}
                  onClick={() => notif.link && router.push(notif.link)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/20 transition-all duration-200',
                    notif.link ? 'cursor-pointer' : ''
                  )}
                >
                  <div className={cn(
                    'p-1.5 rounded-lg shrink-0 border',
                    notif.type === 'order' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                    notif.type === 'payment' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    notif.type === 'booking' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  )}>
                    <Bell className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{notif.title}</p>
                    {notif.description && <p className="text-[11px] text-gray-400 dark:text-white/30 truncate">{notif.description}</p>}
                    <p className="text-[10px] text-gray-400 dark:text-white/20 mt-0.5">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5 animate-pulse-soft" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Bell className="w-10 h-10 text-gray-300 dark:text-white/15 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-white/40">Aucune notification</p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Row 2: Payments + Bookings + Promos */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Paiements en attente */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Clock}>Paiements en attente</SectionTitle>
            <GlassLink href="/dashboard/payments">Voir tout</GlassLink>
          </div>
          {payments.filter((p: any) => p.status === 'pending').length > 0 ? (
            <div className="space-y-2">
              {payments.filter((p: any) => p.status === 'pending').slice(0, 3).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{p.description || 'Paiement'}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/30">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-amber-400 tabular-nums">{Number(p.amount || 0).toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-white/20 text-center py-6">Aucun paiement en attente</p>
          )}
        </GlassCard>

        {/* Réservations à venir */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Calendar}>Réservations à venir</SectionTitle>
            <GlassLink href="/dashboard/bookings">Voir tout</GlassLink>
          </div>
          {upcomingBookingsList.length > 0 ? (
            <div className="space-y-2">
              {upcomingBookingsList.slice(0, 3).map((b: any) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/bookings/${b.id}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] border border-gray-200 dark:border-white/[0.06] hover:border-emerald-300 dark:hover:border-emerald-500/20 transition-all duration-200 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{b.serviceName || b.type || 'Réservation'}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/30">{b.businessName || b.business || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
                      {b.date ? new Date(b.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                    <span className={cn(
                      'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
                      b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    )}>
                      {b.status === 'CONFIRMED' ? 'Confirmée' : 'En attente'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-white/15 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-white/40">Aucune réservation</p>
              <Link href="/marketplace" className="inline-flex items-center gap-1 mt-3 text-xs text-emerald-400 hover:text-emerald-300">
                Explorer <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </GlassCard>

        {/* Promotions */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Percent}>Promotions du jour</SectionTitle>
            <GlassLink href="/dashboard/loyalty">Voir tout</GlassLink>
          </div>
          {promotions.length > 0 ? (
            <div className="space-y-2">
              {promotions.slice(0, 3).map((promo: any, i: number) => (
                <div key={promo.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/10">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0">
                    <Percent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{promo.title || 'Promotion'}</p>
                    {promo.description && <p className="text-[10px] text-gray-400 dark:text-white/30 truncate">{promo.description}</p>}
                    {promo.code && (
                      <div className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10">
                        <span className="text-[10px] font-mono font-bold text-emerald-400">{promo.code}</span>
                      </div>
                    )}
                  </div>
                  <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Percent className="w-10 h-10 text-gray-300 dark:text-white/15 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-white/40">Aucune promotion</p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Recommandations */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <h3 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-[0.15em]">Recommandé pour vous</h3>
            </div>
          </div>
          {promotions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {promotions.slice(0, 4).map((promo: any, i: number) => (
                <div key={promo.id || i} className="p-4 rounded-xl glass hover:border-emerald-500/20 transition-all duration-200 cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                    <Gift className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{promo.title || `Offre #${i + 1}`}</p>
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{promo.businessName || promo.description || 'Découvrez cette offre'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-white/20 text-center py-6">Pas encore de recommandations.</p>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
