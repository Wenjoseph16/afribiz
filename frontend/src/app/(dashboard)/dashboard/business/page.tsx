'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ShoppingBag,
  Calendar,
  Star,
  MessageCircle,
  Bell,
  TrendingUp,
  Eye,
  Sparkles,
  Store,
  Plus,
  Settings,
  BarChart3,
  Award,
  Globe,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DashboardChartsDynamic as DashboardCharts } from '@/components/dashboard/DashboardChartsDynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { ErrorState } from '@/components/ui/ErrorState';
import PendingOrdersAlert from '@/components/dashboard/PendingOrdersAlert';
import { useMyBusiness } from '@/features/hooks/business';
import { useBusinessStats } from '@/features/hooks/business';
import { useNotifications } from '@/features/hooks/notifications';
import { useOrders } from '@/features/hooks/orders';
import { useBookings } from '@/features/hooks/bookings';
import { useReviews } from '@/features/hooks/reviews';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import type { ModuleChartData } from '@/components/dashboard/ModuleCharts';
import AdSlot from '@/components/ads/AdSlot';
import { buildLaunchChecklistState } from '@/lib/launchChecklist';

// ─── Dynamic imports for heavy components ───
const SetupAssistant = dynamic(
  () =>
    import('@/components/dashboard/SetupAssistant').then((mod) => ({
      default: mod.SetupAssistant,
    })),
  {
    ssr: false,
    loading: () => <div className="h-24 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
  }
);
const GrowthSummaryCard = dynamic(() => import('@/components/dashboard/GrowthSummaryCard'), {
  ssr: false,
  loading: () => <div className="h-32 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
});
const DailyActions = dynamic(() => import('@/components/dashboard/DailyActions'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
});
const GrowthRecommendations = dynamic(
  () => import('@/components/dashboard/GrowthRecommendations'),
  {
    ssr: false,
    loading: () => <div className="h-48 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
  }
);
const ModuleCharts = dynamic(() => import('@/components/dashboard/ModuleCharts'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
});
const CopilotDashboardBrief = dynamic(
  () =>
    import('@/components/copilot/CopilotDashboardBrief').then((mod) => ({
      default: mod.CopilotDashboardBrief,
    })),
  {
    ssr: false,
    loading: () => <div className="h-20 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
  }
);
const CopilotInsights = dynamic(
  () =>
    import('@/components/copilot/CopilotInsights').then((mod) => ({
      default: mod.CopilotInsights,
    })),
  {
    ssr: false,
    loading: () => <div className="h-32 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
  }
);
const BusinessMorningBrief = dynamic(
  () => import('@/components/dashboard/BusinessMorningBrief'),
  {
    ssr: false,
    loading: () => <div className="h-40 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
  }
);
const BusinessPlanCard = dynamic(() => import('@/components/dashboard/BusinessPlanCard'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
});
const BusinessAlertQueue = dynamic(() => import('@/components/dashboard/BusinessAlertQueue'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />,
});

const QUICK_ACTIONS = [
  {
    label: 'Page publique',
    href: '/dashboard/public-page',
    icon: Globe,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    label: 'Produits',
    href: '/dashboard/products',
    icon: Store,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Réservations',
    href: '/dashboard/bookings',
    icon: Calendar,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    label: 'Statistiques',
    href: '/dashboard/statistics',
    icon: BarChart3,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    label: 'Messages',
    href: '/dashboard/messages',
    icon: MessageCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    label: 'AfriScore',
    href: '/dashboard/afriscore',
    icon: Award,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
];

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { business } = useBusinessStore();

  const {
    data: myBusiness,
    isLoading: bizLoading,
    error: bizError,
    refetch: bizRefetch,
  } = useMyBusiness();

  // Guard UX : rôle BUSINESS mais aucun profil business → rediriger vers le formulaire d'onboarding.
  // Évite les pages cassées (produits, commandes…) vides pour un business non configuré.
  const canAccess = user?.roles?.includes('BUSINESS');
  const hasProfile = !!(business || myBusiness);
  useEffect(() => {
    if (user && canAccess && !bizLoading && !bizError && !hasProfile) {
      router.replace('/dashboard/business/onboarding');
    }
  }, [user, canAccess, bizLoading, bizError, hasProfile, router]);
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
    queryFn: async () => {
      const res = await apiClient.getConversations();
      return res.data.data;
    },
  });

  // Guard: access denied for non-business users
  if (user && !canAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Accès Business
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Vous devez avoir un rôle BUSINESS pour accéder à cet espace. Activez votre compte
            business depuis votre tableau de bord client.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour au tableau de bord
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (bizError) return <ErrorState message={bizError.message} onRetry={bizRefetch} />;
  if (statsError) return <ErrorState message={statsError.message} />;

  const biz = business || myBusiness;
  const firstName = user?.firstName || 'Cher';
  const notifications = notificationsData?.notifications ?? [];
  const orders = ordersData?.orders ?? [];
  const bookings = bookingsData?.bookings ?? [];
  const reviews = Array.isArray(reviewsData?.reviews || reviewsData)
    ? reviewsData?.reviews || reviewsData
    : [];
  const conversations = Array.isArray(conversationsData?.conversations || conversationsData)
    ? conversationsData?.conversations || conversationsData
    : [];

  // Charts data for ModuleCharts
  const bizModuleChartData: ModuleChartData = useMemo(
    () => ({
      distribution:
        (biz?.modules || []).length > 0
          ? (biz?.modules || []).map((mod: string, i: number) => ({
              name: mod.charAt(0) + mod.slice(1).toLowerCase(),
              value: 1,
              color: ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316'][
                i % 7
              ],
            }))
          : [{ name: 'Modules', value: 1, color: '#6366f1' }],
      daily: [
        { label: 'Commandes', value: orders.length },
        { label: 'Réservations', value: bookings.length },
        { label: 'Avis', value: reviews.length },
        { label: 'Conversations', value: conversations.length },
      ],
    }),
    [biz, orders, bookings, reviews, conversations]
  );

  // Derived values for memoized computations
  const unreadReviews = useMemo(() => reviews.filter((r: any) => !r.read).length, [reviews]);
  const newMessages = useMemo(
    () => conversations.filter((c: any) => c.unreadCount > 0).length,
    [conversations]
  );

  // Growth Cockpit stats using aggregated data (memoized)
  const growthStats = useMemo(
    () => ({
      revenueToday: Number(aggStats?.today?.revenue || 0),
      revenueYesterday: Number(aggStats?.trends?.revenueYesterday || 0),
      revenueWeek: Number(
        aggStats?.trends?.revenueToday + (aggStats?.trends?.revenueYesterday || 0)
      ),
      ordersToday: aggStats?.today?.ordersCount || 0,
      ordersPending: aggStats?.pending?.ordersCount || 0,
      newMessages,
      unreadReviews,
      newCustomers: aggStats?.today?.newClients || 0,
      activeBookings: aggStats?.today?.bookingsCount || 0,
    }),
    [aggStats, newMessages, unreadReviews]
  );

  // Daily actions memoized
  const dailyActions = useMemo(
    () => [
      ...(newMessages > 0
        ? [
            {
              id: 'messages',
              type: 'message' as const,
              priority: 'high' as const,
              label: `${newMessages} conversation${newMessages > 1 ? 's' : ''} non lue${newMessages > 1 ? 's' : ''}`,
              description: 'Répondre rapidement augmente votre taux de conversion',
              link: '/dashboard/messages',
            },
          ]
        : []),
      ...(unreadReviews > 0
        ? [
            {
              id: 'reviews',
              type: 'review' as const,
              priority: 'medium' as const,
              label: `${unreadReviews} avis à répondre`,
              description: 'Répondre aux avis fidélise vos clients',
              link: '/dashboard/reviews',
            },
          ]
        : []),
      // NB: commandes en attente, réservations à confirmer et stock faible sont
      // désormais couverts par la file d'alertes serveur (BusinessAlertQueue) —
      // pas de doublon à l'écran.
    ],
    [newMessages, unreadReviews]
  );

  // Growth recommendations (rule-based, no AI) memoized
  const recommendations = useMemo(
    () => [
      ...(!biz?.logo || !biz?.description
        ? [
            {
              id: 'complete-profile',
              category: 'growth' as const,
              impact: 'high' as const,
              title: 'Complétez votre profil business',
              description:
                'Ajoutez votre logo et une description pour augmenter la confiance des clients.',
              action: 'Compléter mon profil',
              link: '/dashboard/public-page',
            },
          ]
        : []),
      ...(!biz?.modules || biz.modules.length < 2
        ? [
            {
              id: 'activate-modules',
              category: 'products' as const,
              impact: 'high' as const,
              title: 'Activez plus de modules',
              description:
                'Les business avec 3+ modules vendent 2x plus. Activez les modules adaptés à votre activité.',
              action: 'Découvrir les modules',
              link: '/dashboard/marketplace',
            },
          ]
        : []),
      ...(orders.length === 0
        ? [
            {
              id: 'first-order',
              category: 'marketing' as const,
              impact: 'high' as const,
              title: 'Recevez votre première commande',
              description:
                'Partagez votre page publique sur WhatsApp et les réseaux sociaux pour attirer vos premiers clients.',
              action: 'Voir ma page publique',
              link: biz?.slug ? `/business/${biz.slug}` : '/dashboard/public-page',
            },
          ]
        : []),
      ...(reviews.length === 0
        ? [
            {
              id: 'get-reviews',
              category: 'service' as const,
              impact: 'medium' as const,
              title: 'Demandez des avis à vos clients',
              description:
                'Les business avec des avis reçoivent 3x plus de visites. Encouragez vos clients à laisser un avis.',
              action: 'Configurer mes avis',
              link: '/dashboard/reviews',
            },
          ]
        : []),
      ...(stats?.clients && stats.clients < 5
        ? [
            {
              id: 'grow-clients',
              category: 'growth' as const,
              impact: 'medium' as const,
              title: 'Développez votre clientèle',
              description:
                'Utilisez les promotions et le programme de parrainage pour attirer de nouveaux clients.',
              action: 'Créer une promotion',
              link: '/dashboard/promotions',
            },
          ]
        : []),
      ...(!stats?.revenue || stats.revenue < 100000
        ? [
            {
              id: 'first-sales',
              category: 'finance' as const,
              impact: 'high' as const,
              title: 'Lancez une promotion pour booster vos ventes',
              description:
                'Une promotion bien ciblée peut augmenter vos ventes de 40%. Créez une offre dès maintenant.',
              action: 'Créer une promotion',
              link: '/dashboard/promotions',
            },
          ]
        : []),
    ],
    [biz, orders.length, reviews.length, stats?.clients, stats?.revenue]
  );

  // Calculate completion score
  const completionFields = [
    biz?.logo,
    biz?.coverImage,
    biz?.description,
    biz?.phone,
    biz?.address,
    biz?.whatsapp,
    biz?.hours && biz.hours.length > 0,
    biz?.modules && biz.modules.length > 0,
  ];
  const score = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  const launchChecklistState = useMemo(
    () =>
      buildLaunchChecklistState({
        hasPublicPage: !!biz?.slug && biz?.isActive,
        hasProducts: (biz as any)?.products?.length > 0,
        hasPayments: !!(biz as any)?.paymentConfig,
        hasBookings: !!(biz as any)?.bookingConfig,
        hasPromotions: !!(biz as any)?.promotions?.length,
        hasProfile: !!(biz?.description && biz?.phone && biz?.address),
      }),
    [biz]
  );

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
              : 'Bienvenue sur votre espace professionnel'}
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

      <AdSlot page="DASHBOARD_BUSINESS" position="TOP_BANNER" />

      {/* Pending Orders Alert — high priority */}
      <PendingOrdersAlert />

      {/* Copilot — AI Assistant Brief */}
      <CopilotDashboardBrief />

      {/* Copilot — Insights Benchmarks, Anomalies & Seasonal */}
      <CopilotInsights />

      {/* Brief du matin — métriques, conseils & actions rapides (GrowthBrief) */}
      <BusinessMorningBrief />

      {/* Growth Cockpit — Daily Summary */}
      <Card padding="lg">
        <GrowthSummaryCard stats={growthStats} businessName={biz?.name} />
      </Card>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Commandes"
          value={orders.length}
          trend={
            growthStats.ordersPending > 0
              ? { value: `${growthStats.ordersPending} en attente`, positive: false }
              : undefined
          }
        />
        <StatsCard
          icon={<Calendar className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Réservations"
          value={bookings.length}
        />
        <StatsCard
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Avis"
          value={reviews.length}
          trend={
            growthStats.unreadReviews > 0
              ? { value: `${growthStats.unreadReviews} à répondre`, positive: false }
              : undefined
          }
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-brand/10"
          iconColor="text-brand"
          label="CA Aujourd'hui"
          value={`${(growthStats.revenueToday || 0).toLocaleString()} FCFA`}
          trend={
            growthStats.revenueToday > 0 && growthStats.revenueYesterday > 0
              ? {
                  value: `${growthStats.revenueToday > growthStats.revenueYesterday ? '+' : '-'}${Math.abs(((growthStats.revenueToday - growthStats.revenueYesterday) / (growthStats.revenueYesterday || 1)) * 100).toFixed(0)}% vs hier`,
                  positive: growthStats.revenueToday > growthStats.revenueYesterday,
                }
              : undefined
          }
        />
      </div>

      {/* Plan & Alert queue — le cockpit d'action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BusinessAlertQueue />
        </div>
        <div>
          <BusinessPlanCard />
        </div>
      </div>

      {/* Modules overview chart */}
      {orders.length + bookings.length + reviews.length + conversations.length > 0 && (
        <ModuleCharts
          data={bizModuleChartData}
          title="VUE D'ENSEMBLE BUSINESS"
          distributionLabel="Modules actifs"
          dailyLabel="Activité récente"
          variant="products"
        />
      )}

      {/* Setup Assistant */}
      <SetupAssistant completionScore={score} business={biz} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Checklist de lancement
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
              {launchChecklistState.progressScore}% prêt à accueillir vos premiers clients
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {launchChecklistState.primaryAction.description}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="font-semibold">Prochaine étape :</span>{' '}
            {launchChecklistState.primaryAction.title}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {launchChecklistState.steps.map((step) => (
            <div
              key={step.id}
              className={`rounded-xl border p-3 ${step.done ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/70'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${step.done ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}
                >
                  {step.done ? 'Fait' : 'À faire'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                <div
                  className={cn(
                    'p-2.5 rounded-xl',
                    action.bg,
                    'group-hover:scale-110 transition-transform duration-200'
                  )}
                >
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
            <Link
              href="/dashboard/orders"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors"
            >
              Voir tout →
            </Link>
          </div>
          {orders.length > 0 ? (
            <div className="space-y-2">
              {orders.slice(0, 5).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        Commande #{order.orderNumber?.slice(-6) || order.id?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('fr-FR')
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {Number(order.totalAmount || 0).toLocaleString()} FCFA
                    </p>
                    <span
                      className={cn('text-xs font-medium', {
                        'text-emerald-600':
                          order.status === 'DELIVERED' || order.status === 'CONFIRMED',
                        'text-red-600': order.status === 'CANCELLED',
                        'text-amber-600': !['DELIVERED', 'CONFIRMED', 'CANCELLED'].includes(
                          order.status
                        ),
                      })}
                    >
                      {order.status === 'DELIVERED'
                        ? 'Livrée'
                        : order.status === 'CONFIRMED'
                          ? 'Confirmée'
                          : order.status === 'CANCELLED'
                            ? 'Annulée'
                            : 'En cours'}
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
            <Link
              href="/dashboard/notifications"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors"
            >
              Voir tout →
            </Link>
          </div>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notif: any) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 shrink-0">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      {notif.title}
                    </p>
                    {notif.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {notif.description}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {notif.createdAt
                        ? new Date(notif.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />
                  )}
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
            <Link
              href="/dashboard/bookings"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors"
            >
              Voir tout →
            </Link>
          </div>
          {bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.slice(0, 5).map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {booking.serviceName || booking.type || 'Réservation'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.date
                          ? new Date(booking.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn('text-xs font-medium shrink-0 ml-3', {
                      'text-emerald-600':
                        booking.status === 'confirmed' || booking.status === 'CONFIRMED',
                      'text-amber-600':
                        booking.status === 'pending' || booking.status === 'PENDING',
                      'text-red-600': ['cancelled', 'CANCELLED'].includes(booking.status),
                    })}
                  >
                    {['confirmed', 'CONFIRMED'].includes(booking.status)
                      ? 'Confirmée'
                      : ['pending', 'PENDING'].includes(booking.status)
                        ? 'En attente'
                        : 'Annulée'}
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
            <Link
              href="/dashboard/marketplace"
              className="text-xs font-medium text-brand hover:text-brand-700 transition-colors"
            >
              Marketplace →
            </Link>
          </div>
          {biz?.modules && biz.modules.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {biz.modules.map((mod: any) => (
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
