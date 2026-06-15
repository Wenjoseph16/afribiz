'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package, Activity, ShoppingCart, Users, DollarSign, Star,
  Download, ArrowRight, Clock, MessageCircle, TrendingUp,
  Plus, Code,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import AdSlot from '@/components/ads/AdSlot';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useDeveloperDashboard } from '@/features/developerHooks';
import type { DeveloperModule, DeveloperModuleInstallation, DeveloperRevenue, DeveloperModuleReview } from '@/types/developer';
import { MODULE_STATUS_LABELS, PRICING_LABELS } from '@/types/developer';

const STATUS_VARIANT: Record<string, 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  DRAFT: 'default',
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  ARCHIVED: 'default',
};

const REVENUE_VARIANT: Record<string, 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  SALE: 'success',
  SUBSCRIPTION: 'info',
  UPGRADE: 'purple',
  COMMISSION: 'brand',
};

const REVENUE_LABELS: Record<string, string> = {
  SALE: 'Vente',
  SUBSCRIPTION: 'Abonnement',
  UPGRADE: 'Upgrade',
  COMMISSION: 'Commission',
};

export default function DeveloperDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Guard: redirect non-developer users
  useEffect(() => {
    if (user && !user.roles?.includes('DEVELOPER') && user.primaryRole !== 'DEVELOPER') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data: dashboard, isLoading, error, refetch } = useDeveloperDashboard();

  const overview = useMemo(() => {
    if (!dashboard) return null;
    const o = dashboard.overview || {};
    return {
      totalModules: o.totalModules ?? dashboard.modules?.total ?? 0,
      activeModules: o.activeModules ?? dashboard.modules?.published ?? 0,
      totalSales: o.totalSales ?? dashboard.modules?.totalSales ?? 0,
      totalClients: o.totalClients ?? 0,
      totalRevenue: o.totalRevenue ?? dashboard.revenue?.total ?? 0,
      totalDownloads: o.totalDownloads ?? dashboard.modules?.totalInstalls ?? 0,
      totalInstalls: o.totalInstalls ?? dashboard.modules?.totalInstalls ?? 0,
      totalSubs: o.totalSubs ?? 0,
      totalReviews: o.totalReviews ?? dashboard.reviews?.total ?? 0,
      totalTickets: o.totalTickets ?? dashboard.tickets?.total ?? 0,
      averageRating: o.averageRating ?? dashboard.reviews?.averageRating ?? dashboard.reviews?.average ?? 0,
    };
  }, [dashboard]);

  const recentModules = useMemo(() => {
    if (!dashboard) return [];
    const raw = dashboard.recentModules || [];
    return Array.isArray(raw) ? raw.slice(0, 5) : [];
  }, [dashboard]);

  const recentInstallations = useMemo(() => {
    if (!dashboard) return [];
    const raw = dashboard.recentInstallations || [];
    return Array.isArray(raw) ? raw.slice(0, 5) : [];
  }, [dashboard]);

  const recentRevenues = useMemo(() => {
    if (!dashboard) return [];
    const raw = dashboard.recentRevenues || [];
    return Array.isArray(raw) ? raw.slice(0, 5) : [];
  }, [dashboard]);

  const recentReviews = useMemo(() => {
    if (!dashboard) return [];
    const raw = dashboard.recentReviews || dashboard.reviews?.recent || [];
    return Array.isArray(raw) ? raw.slice(0, 5) : [];
  }, [dashboard]);

  const recentTickets = useMemo(() => {
    if (!dashboard) return [];
    const raw = dashboard.recentTickets || [];
    return Array.isArray(raw) ? raw.slice(0, 5) : [];
  }, [dashboard]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  if (!dashboard) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={<Code className="h-12 w-12" />}
          title="Vous n'êtes pas encore développeur"
          description="Activez votre rôle développeur pour commencer à créer et publier des modules sur la marketplace."
          action={
            <Link href="/dashboard/developer/onboarding">
              <Button size="lg" variant="gradient">Devenir développeur</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const safeOverview = overview!;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' FCFA';

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderStars = (rating: number) => {
    return (
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3 w-3',
              star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
            )}
          />
        ))}
      </span>
    );
  };

  const statsCards = [
    { icon: Package, label: 'Modules total', value: safeOverview.totalModules, color: 'bg-brand-50 dark:bg-brand-900/30 text-brand' },
    { icon: Activity, label: 'Modules actifs', value: safeOverview.activeModules, color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' },
    { icon: ShoppingCart, label: 'Ventes totales', value: safeOverview.totalSales, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' },
    { icon: Users, label: 'Clients', value: safeOverview.totalClients, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' },
    { icon: DollarSign, label: 'Revenu total', value: formatCurrency(safeOverview.totalRevenue), color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' },
    { icon: Star, label: 'Notes moyennes', value: safeOverview.averageRating.toFixed(1) + ' / 5', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Espace Développeur"
        description="Gérez vos modules, suivez vos ventes et interagissez avec vos clients"
        breadcrumbs={[{ label: 'Développeur' }]}
        actions={
          <Link href="/dashboard/developer/modules/publish">
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" />
              Nouveau module
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-lg', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Ad Slot */}
      <AdSlot page="DASHBOARD_DEVELOPER" position="TOP_BANNER" className="mb-4" />

      {/* Sections grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Modules récents */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Modules récents
            </h3>
            <Link href="/dashboard/developer/modules" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
              Voir tout →
            </Link>
          </div>
          {recentModules.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Aucun module"
              description="Vous n'avez pas encore créé de module."
              action={
                <Link href="/dashboard/developer/modules/publish">
                  <Button size="xs" variant="secondary">
                    <Plus className="h-3 w-3" />
                    Créer un module
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {recentModules.map((mod: DeveloperModule) => (
                <div key={mod.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {mod.logo ? (
                      <Image src={mod.logo ?? ''} alt={mod.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                    ) : (
                      <Package className="h-5 w-5 text-brand" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{mod.name}</p>
                      <Badge variant={STATUS_VARIANT[mod.status] || 'default'} size="xs">
                        {MODULE_STATUS_LABELS[mod.status] || mod.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      {mod.price ? `${mod.price.toLocaleString()} FCFA` : PRICING_LABELS[mod.pricingType]}
                      {mod.category && ` · ${mod.category}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Installations récentes */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Installations récentes
            </h3>
            <Link href="/dashboard/developer/installations" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
              Voir tout →
            </Link>
          </div>
          {recentInstallations.length === 0 ? (
            <EmptyState
              icon={<Download className="h-8 w-8" />}
              title="Aucune installation"
              description="Les installations de vos modules apparaîtront ici."
            />
          ) : (
            <div className="space-y-2">
              {recentInstallations.map((inst: DeveloperModuleInstallation) => (
                <div key={inst.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Download className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {inst.business?.name || 'Business'} — {inst.module?.name || 'Module'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {inst.installedAt ? formatDate(inst.installedAt) : formatDate(inst.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Revenus récents */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Revenus récents
            </h3>
            <Link href="/dashboard/developer/revenues" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
              Voir tout →
            </Link>
          </div>
          {recentRevenues.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-8 w-8" />}
              title="Aucun revenu"
              description="Les revenus de vos modules apparaîtront ici."
            />
          ) : (
            <div className="space-y-2">
              {recentRevenues.map((rev: DeveloperRevenue) => (
                <div key={rev.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {rev.netAmount ? formatCurrency(rev.netAmount) : formatCurrency(rev.amount)}
                      </p>
                      <Badge variant={REVENUE_VARIANT[rev.type] || 'default'} size="xs">
                        {REVENUE_LABELS[rev.type] || rev.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      {rev.module?.name}{rev.module?.name && ' · '}{rev.createdAt ? formatDate(rev.createdAt) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Avis récents */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Avis récents
            </h3>
            <Link href="/dashboard/developer/reviews" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
              Voir tout →
            </Link>
          </div>
          {recentReviews.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-8 w-8" />}
              title="Aucun avis"
              description="Les avis de vos clients apparaîtront ici."
            />
          ) : (
            <div className="space-y-2">
              {recentReviews.map((review: DeveloperModuleReview) => (
                <div key={review.id} className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Utilisateur'}
                        </p>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {review.comment || review.title || 'Avis sans commentaire'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {review.module?.name}{review.module?.name && ' · '}{review.createdAt ? formatDate(review.createdAt) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tickets récents */}
        {recentTickets.length > 0 && (
          <Card padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tickets récents
              </h3>
              <Link href="/dashboard/developer/support" className="text-xs font-medium text-brand hover:text-brand-700 transition-colors">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-2">
              {recentTickets.map((ticket: any) => (
                <div key={ticket.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-400">
                      {ticket.business?.name && `${ticket.business.name} · `}{ticket.createdAt ? formatDate(ticket.createdAt) : ''}
                    </p>
                  </div>
                  <Badge
                    variant={ticket.status === 'OPEN' ? 'danger' : ticket.status === 'IN_PROGRESS' ? 'warning' : ticket.status === 'RESOLVED' ? 'success' : 'default'}
                    size="xs"
                  >
                    {ticket.status === 'OPEN' ? 'Ouvert' : ticket.status === 'IN_PROGRESS' ? 'En cours' : ticket.status === 'RESOLVED' ? 'Résolu' : ticket.status === 'CLOSED' ? 'Fermé' : ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
