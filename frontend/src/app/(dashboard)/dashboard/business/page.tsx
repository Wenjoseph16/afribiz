'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, ShoppingBag, Calendar, Wallet, Star,
  MessageCircle, Bell, TrendingUp, Eye, Sparkles,
  Store, Plus, Settings, BarChart3, Award, Globe,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardChartsDynamic as DashboardCharts } from '@/components/dashboard/DashboardChartsDynamic';
import { SetupAssistant } from '@/components/dashboard/SetupAssistant';
import GrowthSummaryCard from '@/components/dashboard/GrowthSummaryCard';
import DailyActions from '@/components/dashboard/DailyActions';
import GrowthRecommendations from '@/components/dashboard/GrowthRecommendations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { ErrorState } from '@/components/ui/ErrorState';
import PendingOrdersAlert from '@/components/dashboard/PendingOrdersAlert';
import { useMyBusiness, useBusinessStats, useNotifications, useOrders, useBookings, useReviews } from '@/features/hooks';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import AdSlot from '@/components/ads/AdSlot';

const QUICK_ACTIONS = [
  { label: 'Page publique', href: '/dashboard/public-page', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Produits', href: '/dashboard/products', icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Réservations', href: '/dashboard/bookings', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Statistiques', href: '/dashboard/statistics', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'AfriScore', href: '/dashboard/afriscore', icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

export default function BusinessDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { business } = useBusinessStore();

  // Guard: redirect non-business users
  useEffect(() => {
    if (user && !user.roles?.includes('BUSINESS') && user.primaryRole !== 'BUSINESS') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data: myBusiness, isLoading: bizLoading, error: bizError, refetch: bizRefetch } = useMyBusiness();
  const { data: stats, error: statsError } = useBusinessStats();
  const { data: notificationsData } = useNotifications({ limit: 5 });
  const { data: ordersData } = useOrders({ limit: 5 });
  const { data: bookingsData } = useBookings({ limit: 5 });
  // Aggregated stats for charts (from /business/stats/aggregated)
  const { data: aggStats } = useQuery({
    queryKey: ['business-stats', 'aggregated'],
    queryFn: async () => {
      const res = await apiClient.get('/business/stats/aggregated');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const { data: reviewsData } = useReviews({ limit: 5 });
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations', 'unread'],
    queryFn: async () => { const res = await apiClient.getConversations(); return res.data.data; },
  });

  if (bizError) return <ErrorState message={bizError.message} onRetry={bizRefetch} />;
  if (statsError) return <ErrorState message={statsError.message} />;

  const biz = business || myBusiness;
  const firstName = user?.firstName || 'Cher';
  const notifications = Array.isArray(notificationsData?.notifications || notificationsData)
    ? (notificationsData?.notifications || notificationsData) as any[]
    : [];
  const orders = Array.isArray(ordersData?.orders || ordersData)
    ? (ordersData?.orders || ordersData) as any[]
    : [];
  const bookings = Array.isArray(bookingsData?.bookings || bookingsData)
    ? (bookingsData?.bookings || bookingsData) as any[]
    : [];
  const reviews = Array.isArray(reviewsData?.reviews || reviewsData) ? (reviewsData?.reviews || reviewsData) as any[] : [];
  const conversations = Array.isArray(conversationsData?.conversations || conversationsData) ? (conversationsData?.conversations || conversationsData) as any[] : [];

  // Growth Cockpit stats using aggregated data
  const growthStats = {
    revenueToday: Number(aggStats?.today?.revenue || 0),
    revenueYesterday: Number(aggStats?.trends?.revenueYesterday || 0),
    revenueWeek: Number(aggStats?.trends?.revenueToday + (aggStats?.trends?.revenueYesterday || 0)), // Simple estimation or use a week sum if available
    ordersToday: aggStats?.today?.ordersCount || 0,
    ordersPending: aggStats?.pending?.ordersCount || 0,
    newMessages: conversations.filter((c: any) => c.unreadCount > 0).length,
    unreadReviews: reviews.filter((r: any) => !r.read).length,
    newCustomers: aggStats?.today?.newClients || 0,
    activeBookings: aggStats?.today?.bookingsCount || 0,
  };

  // Daily actions
  const dailyActions = [
    ...(growthStats.newMessages > 0 ? [{
      id: 'messages', type: 'message' as const, priority: 'high' as const,
      label: `${growthStats.newMessages} conversation${growthStats.newMessages > 1 ? 's' : ''} non lue${growthStats.newMessages > 1 ? 's' : ''}`,
      description: 'Répondre rapidement augmente votre taux de conversion',
      link: '/dashboard/messages',
    }] : []),
    ...(reviews.filter((r: any) => !r.read).length > 0 ? [{
      id: 'reviews', type: 'review' as const, priority: 'medium' as const,
      label: `${reviews.filter((r: any) => !r.read).length} avis à répondre`,
      description: 'Répondre aux avis fidélise vos clients',
      link: '/dashboard/reviews',
    }] : []),
    ...(growthStats.ordersPending > 0 ? [{
      id: 'orders', type: 'order' as const, priority: 'high' as const,
      label: `${growthStats.ordersPending} commande${growthStats.ordersPending > 1 ? 's' : ''} en attente`,
      description: 'Traitez les commandes pour satisfaire vos clients',
      link: '/dashboard/orders',
    }] : []),
    ...(bookings.filter((b: any) => ['pending', 'PENDING'].includes(b.status)).length > 0 ? [{
      id: 'bookings', type: 'booking' as const, priority: 'medium' as const,
      label: `${bookings.filter((b: any) => ['pending', 'PENDING'].includes(b.status)).length} réservation${bookings.filter((b: any) => ['pending', 'PENDING'].includes(b.status)).length > 1 ? 's' : ''} à confirmer`,
      description: 'Confirmez les réservations en attente',
      link: '/dashboard/bookings',
    }] : []),
    ...(aggStats?.alerts?.lowStock > 0 ? [{
      id: 'low-stock', type: 'order' as const, priority: 'medium' as const,
      label: `${aggStats.alerts.lowStock} produit(s) en stock faible`,
      description: 'Pensez à réapprovisionner votre inventaire',
      link: '/dashboard/products/stock-alerts',
    }] : []),
  ];

  // Growth recommendations (rule-based, no AI)
  const recommendations = [
    ...(!biz?.logo || !biz?.description ? [{
      id: 'complete-profile', category: 'growth' as const, impact: 'high' as const,
      title: 'Complétez votre profil business',
      description: 'Ajoutez votre logo et une description pour augmenter la confiance des clients.',
      action: 'Compléter mon profil',
      link: '/dashboard/public-page',
    }] : []),
    ...(!biz?.modules || biz.modules.length < 2 ? [{
      id: 'activate-modules', category: 'products' as const, impact: 'high' as const,
      title: 'Activez plus de modules',
      description: 'Les business avec 3+ modules vendent 2x plus. Activez les modules adaptés à votre activité.',
      action: 'Découvrir les modules',
      link: '/dashboard/marketplace',
    }] : []),
    ...(orders.length === 0 ? [{
      id: 'first-order', category: 'marketing' as const, impact: 'high' as const,
      title: 'Recevez votre première commande',
      description: 'Partagez votre page publique sur WhatsApp et les réseaux sociaux pour attirer vos premiers clients.',
      action: 'Voir ma page publique',
      link: biz?.slug ? `/business/${biz.slug}` : '/dashboard/public-page',
    }] : []),
    ...(reviews.length === 0 ? [{
      id: 'get-reviews', category: 'service' as const, impact: 'medium' as const,
      title: 'Demandez des avis à vos clients',
      description: 'Les business avec des avis reçoivent 3x plus de visites. Encouragez vos clients à laisser un avis.',
      action: 'Configurer mes avis',
      link: '/dashboard/reviews',
    }] : []),
    ...(stats?.clients && stats.clients < 5 ? [{
      id: 'grow-clients', category: 'growth' as const, impact: 'medium' as const,
      title: 'Développez votre clientèle',
      description: 'Utilisez les promotions et le programme de parrainage pour attirer de nouveaux clients.',
      action: 'Créer une promotion',
      link: '/dashboard/promotions',
    }] : []),
    ...(!stats?.revenue || stats.revenue < 100000 ? [{
      id: 'first-sales', category: 'finance' as const, impact: 'high' as const,
      title: 'Lancez une promotion pour booster vos ventes',
      description: 'Une promotion bien ciblée peut augmenter vos ventes de 40%. Créez une offre dès maintenant.',
      action: 'Créer une promotion',
      link: '/dashboard/promotions',
    }] : []),
  ];

  // Calculate completion score
  const completionFields = [
    biz?.logo, biz?.coverImage, biz?.description,
    biz?.phone, biz?.address, biz?.whatsapp,
    biz?.hours && biz.hours.length > 0,
    biz?.modules && biz.modules.length > 0,
  ];
  const score = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  if (bizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand/30 border-t-brand rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Chargement de votre dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Bonjour, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {biz
              ? `Bienvenue sur votre espace professionnel — ${biz.name}`
              : 'Bienvenue sur votre espace professionnel'
            }
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {biz?.slug && (
            <Link href={`/business/${biz.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1.5" />
                Voir ma page
              </Button>
            </Link>
          )}
          <Link href="/dashboard/public-page">
            <Button size="sm">
              <Settings className="h-4 w-4 mr-1.5" />
              Configurer
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Orders Alert — high priority */}
      <PendingOrdersAlert />

      {/* Growth Cockpit — Daily Summary */}
      <Card padding="lg">
        <GrowthSummaryCard stats={growthStats} businessName={biz?.name} />
      </Card>

      {/* Setup Assistant */}
      <SetupAssistant completionScore={score} business={biz} />

      {/* Growth Cockpit — Actions + Recommendations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailyActions actions={dailyActions} />
        </div>
        <div>
          <GrowthRecommendations recommendations={recommendations} />
        </div>
      </div>

      {/* Charts section */}
      <DashboardCharts stats={aggStats} orders={orders} />

      {/* Quick Actions & Modules */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Actions rapides
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand/30 dark:hover:border-brand/40 hover:shadow-sm transition-all duration-200 group"
              >
                <div className={cn('p-2.5 rounded-xl', action.bg, 'group-hover:scale-110 transition-transform duration-200')}>
                  <Icon className={cn('h-5 w-5', action.color)} />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 text-center">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Dernières commandes
            </h3>
            <Link href="/dashboard/orders" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
              Voir tout →
            </Link>
          </div>
          {orders.length > 0 ? (
            <div className="space-y-2">
              {orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        Commande #{order.orderNumber?.slice(-6) || order.id?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {Number(order.totalAmount || 0).toLocaleString()} FCFA
                    </p>
                    <span className={cn('text-xs font-medium', {
                      'text-emerald-600': order.status === 'DELIVERED' || order.status === 'CONFIRMED',
                      'text-red-600': order.status === 'CANCELLED',
                      'text-amber-600': !['DELIVERED', 'CONFIRMED', 'CANCELLED'].includes(order.status),
                    })}>
                      {order.status === 'DELIVERED' ? 'Livrée' :
                       order.status === 'CONFIRMED' ? 'Confirmée' :
                       order.status === 'CANCELLED' ? 'Annulée' : 'En cours'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune commande pour le moment</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                Les commandes de vos clients apparaîtront ici
              </p>
            </div>
          )}
        </Card>

        {/* Recent Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Notifications
            </h3>
            <Link href="/dashboard/notifications" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
              Voir tout →
            </Link>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notif: any) => (
                <div key={notif.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 shrink-0">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{notif.title}</p>
                    {notif.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{notif.description}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune notification</p>
            </div>
          )}
        </Card>

        {/* Sponsored */}
        <AdSlot page="DASHBOARD_BUSINESS" position="SIDEBAR" />
      </div>

      {/* Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Réservations à venir
            </h3>
            <Link href="/dashboard/bookings" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
              Voir tout →
            </Link>
          </div>
          {bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {booking.serviceName || booking.type || 'Réservation'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.date ? new Date(booking.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-medium shrink-0 ml-3', {
                    'text-emerald-600': booking.status === 'confirmed' || booking.status === 'CONFIRMED',
                    'text-amber-600': booking.status === 'pending' || booking.status === 'PENDING',
                    'text-red-600': ['cancelled', 'CANCELLED'].includes(booking.status),
                  })}>
                    {['confirmed', 'CONFIRMED'].includes(booking.status) ? 'Confirmée' :
                     ['pending', 'PENDING'].includes(booking.status) ? 'En attente' : 'Annulée'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune réservation</p>
            </div>
          )}
        </Card>

        {/* Modules Overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Modules actifs
            </h3>
            <Link href="/dashboard/marketplace" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
              Marketplace →
            </Link>
          </div>
          {biz?.modules && biz.modules.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {biz.modules.map((mod) => (
                <Link
                  key={mod}
                  href={`/dashboard/${mod.toLowerCase()}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand/5 text-brand text-xs font-medium rounded-full border border-brand/10 hover:bg-brand/10 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  {mod.charAt(0) + mod.slice(1).toLowerCase()}
                </Link>
              ))}
              <Link
                href="/dashboard/marketplace"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-400 text-xs font-medium rounded-full border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Ajouter
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucun module activé</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 mb-4">
                Activez des modules pour enrichir votre business
              </p>
              <Link href="/dashboard/marketplace">
                <Button size="sm">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Découvrir les modules
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
