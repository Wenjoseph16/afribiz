'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Percent,
  Plus,
  Gift,
  Tag,
  TrendingUp,
  Loader,
  CalendarDays,
  AlertTriangle,
  Eye,
  Pencil,
  Trash2,
  Clock,
  Target,
  Hash,
  Repeat,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { cn } from '@/lib/utils';
import { CopilotTips } from '@/components/copilot/CopilotTips';
import { SetupGuard } from '@/components/dashboard/SetupGuard';
import { formatPrice } from '@/utils/helpers';
import { useMyPromotions, useDeletePromotion, promoKeys } from '@/features/hooks/promotions';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types ───
interface Promotion {
  id: string;
  title: string;
  description: string | null;
  promotionType: string;
  discountValue: number | string;
  code: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isFeatured?: boolean;
  usageCount?: number;
  maxUsageCount?: number | null;
  minOrderAmount?: number | string | null;
  targetType?: string;
  autoApply?: boolean;
  image?: string | null;
  createdAt?: string;
}

type TabType = 'all' | 'active' | 'inactive' | 'expired';

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Pourcentage',
  FIXED: 'Montant fixe',
  FREE_SHIPPING: 'Livraison offerte',
  BUY_X_GET_Y: 'Acheté 1 offert',
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  PERCENTAGE: Percent,
  FIXED: Tag,
  FREE_SHIPPING: Gift,
  BUY_X_GET_Y: Repeat,
};

// Formateur de date sécurisé (jamais de crash Invalid Date)
function safeDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  const d = safeDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', opts);
}

function InfoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value || '—'}</p>
    </div>
  );
}

function promoStatus(p: Promotion): { key: 'active' | 'inactive' | 'expired' } {
  const endsAt = safeDate(p.endsAt);
  if (endsAt && endsAt <= new Date()) return { key: 'expired' };
  if (!p.isActive) return { key: 'inactive' };
  return { key: 'active' };
}

const STATUS_BADGE: Record<string, { label: string; tone: 'success' | 'danger' | 'muted' }> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'muted' },
  expired: { label: 'Expirée', tone: 'danger' },
};

export default function PromotionsPage() {
  const qc = useQueryClient();
  const { data: promosData, isLoading, error, refetch } = useMyPromotions({ limit: 100 });
  const deletePromo = useDeletePromotion();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const allPromos: Promotion[] = Array.isArray(promosData)
    ? promosData
    : promosData?.promotions || promosData?.data || [];
  const selectedPromo = allPromos.find((p) => p.id === selectedId) || null;

  const now = new Date();
  const stats = useMemo(() => {
    const active = allPromos.filter(
      (p) => p.isActive && (!safeDate(p.endsAt) || (safeDate(p.endsAt) as Date) > now)
    ).length;
    const expired = allPromos.filter(
      (p) => safeDate(p.endsAt) && (safeDate(p.endsAt) as Date) <= now
    ).length;
    const usages = allPromos.reduce((a, p) => a + Number(p.usageCount || 0), 0);
    return { total: allPromos.length, active, expired, usages };
  }, [allPromos, now]);

  const filtered = useMemo(() => {
    let f = [...allPromos];
    switch (activeTab) {
      case 'active':
        f = f.filter((p) => promoStatus(p).key === 'active');
        break;
      case 'inactive':
        f = f.filter((p) => promoStatus(p).key === 'inactive');
        break;
      case 'expired':
        f = f.filter((p) => promoStatus(p).key === 'expired');
        break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.code || '').toLowerCase().includes(q) ||
          (TYPE_LABELS[p.promotionType] || p.promotionType).toLowerCase().includes(q)
      );
    }
    return f;
  }, [allPromos, activeTab, searchQuery]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deletePromo.mutateAsync(deleteTarget.id);
    await qc.invalidateQueries({ queryKey: promoKeys.all });
    setDeleteTarget(null);
  };

  if (error)
    return (
      <ErrorState message={(error as any)?.message || 'Erreur de chargement'} onRetry={refetch} />
    );

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Centre de pilotage des promotions"
        description="Créez, suivez et mesurez vos offres promotionnelles — chaque promotion s'applique automatiquement au panier de vos clients"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Marketing', href: '/dashboard/marketing' },
          { label: 'Promotions' },
        ]}
        actions={
          <SetupGuard
            module="PROMOTIONS"
            action="Nouvelle promotion"
            configureHref="/dashboard/business/settings"
          >
            <Link href="/dashboard/promotions/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Nouvelle promotion
              </Button>
            </Link>
          </SetupGuard>
        }
      />

      <CopilotTips moduleKey="PROMOTIONS" />

      {/* KPIs temps réel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Percent className="h-5 w-5" />}
          iconBg="bg-brand-50 dark:bg-brand-900/30"
          iconColor="text-brand"
          label="Total promotions"
          value={stats.total}
        />
        <StatsCard
          icon={<Gift className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          label="Actives"
          value={stats.active}
          trend={
            stats.active > 0
              ? { value: 'en cours', positive: true }
              : { value: 'à lancer', positive: false }
          }
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          label="Expirées"
          value={stats.expired}
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          label="Utilisations totales"
          value={stats.usages}
        />
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <LiveBadge tone="success" label="Temps réel" value={`${stats.active} active(s)`} />
          <p className="text-xs text-gray-400 hidden sm:block">
            Les codes sont appliqués automatiquement au panier de vos clients
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
            {(['all', 'active', 'inactive', 'expired'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  activeTab === tab
                    ? 'bg-brand text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {tab === 'all'
                  ? 'Toutes'
                  : tab === 'active'
                    ? 'Actives'
                    : tab === 'inactive'
                      ? 'Inactives'
                      : 'Expirées'}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une promotion ou un code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
        </div>
      </Card>

      {/* Table dense */}
      {filtered.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Percent className="h-8 w-8" />}
            title="Aucune promotion"
            description={
              searchQuery || activeTab !== 'all'
                ? 'Aucune promotion ne correspond à ce filtre.'
                : 'Créez votre première promotion pour booster vos ventes — remise, code ou offre spéciale.'
            }
            action={
              <SetupGuard
                module="PROMOTIONS"
                action="Créer une promotion"
                configureHref="/dashboard/business/settings"
              >
                <Link href="/dashboard/promotions/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Créer une promotion
                  </Button>
                </Link>
              </SetupGuard>
            }
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Promotion</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Code</th>
                  <th className="p-4 font-medium">Période</th>
                  <th className="p-4 font-medium">Usages</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((promo) => {
                  const { key } = promoStatus(promo);
                  const badge = STATUS_BADGE[key];
                  const TypeIcon = TYPE_ICONS[promo.promotionType] || Percent;
                  return (
                    <tr
                      key={promo.id}
                      onClick={() => setSelectedId(promo.id)}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="min-w-[200px]">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {promo.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[260px]">
                            {promo.description || '—'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          <TypeIcon className="h-3.5 w-3.5 text-gray-400" />
                          {TYPE_LABELS[promo.promotionType] || promo.promotionType}
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {promo.discountValue}
                            {promo.promotionType === 'PERCENTAGE' ? '%' : ' FCFA'}
                          </span>
                        </span>
                      </td>
                      <td className="p-4">
                        {promo.code ? (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-brand font-semibold">
                            {promo.code}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Auto</span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {formatDate(promo.startsAt, { day: 'numeric', month: 'short' })}
                          {' — '}
                          {formatDate(promo.endsAt, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {promo.usageCount || 0}
                          {promo.maxUsageCount ? ` / ${promo.maxUsageCount}` : ''}
                        </span>
                      </td>
                      <td className="p-4">
                        <LiveBadge tone={badge.tone} label={badge.label} pulse={key === 'active'} />
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/promotions/${promo.id}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                            title="Voir"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/promotions/${promo.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(promo)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Drawer 360° promotion */}
      <Drawer
        isOpen={!!selectedPromo}
        onClose={() => setSelectedId(null)}
        icon={<Percent className="h-5 w-5" />}
        title={selectedPromo?.title}
        subtitle={
          selectedPromo
            ? `Créée le ${formatDate(selectedPromo.createdAt, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}`
            : undefined
        }
        footer={
          selectedPromo ? (
            <div className="flex gap-2">
              <Link href={`/dashboard/promotions/${selectedPromo.id}/edit`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => setDeleteTarget(selectedPromo)}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedPromo && (
          <div className="space-y-5">
            {/* Statut */}
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const { key } = promoStatus(selectedPromo);
                const badge = STATUS_BADGE[key];
                return <LiveBadge tone={badge.tone} label={badge.label} pulse={key === 'active'} />;
              })()}
              {selectedPromo.isFeatured && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <Star className="h-3 w-3" />
                  Mise en avant
                </span>
              )}
              {selectedPromo.autoApply && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-2.5 py-0.5 text-xs font-medium text-brand">
                  <Zap className="h-3 w-3" />
                  Application auto
                </span>
              )}
            </div>

            {selectedPromo.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedPromo.description}
              </p>
            )}

            {/* Réduction */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Réduction
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InfoStat
                  icon={TYPE_ICONS[selectedPromo.promotionType] || Percent}
                  label="Type"
                  value={TYPE_LABELS[selectedPromo.promotionType] || selectedPromo.promotionType}
                />
                <InfoStat
                  icon={Percent}
                  label="Valeur"
                  value={`${selectedPromo.discountValue}${
                    selectedPromo.promotionType === 'PERCENTAGE' ? '%' : ' FCFA'
                  }`}
                />
                <InfoStat
                  icon={Hash}
                  label="Code"
                  value={selectedPromo.code || 'Application automatique'}
                />
                <InfoStat
                  icon={Target}
                  label="Cible"
                  value={
                    selectedPromo.targetType === 'ALL'
                      ? 'Tous les clients'
                      : selectedPromo.targetType || 'Tous'
                  }
                />
              </div>
            </div>

            {/* Période */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <CalendarDays className="h-4 w-4" />
                Période
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatDate(selectedPromo.startsAt, { day: 'numeric', month: 'short' })} —{' '}
                {formatDate(selectedPromo.endsAt, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Conditions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Commande min.
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedPromo.minOrderAmount
                    ? formatPrice(Number(selectedPromo.minOrderAmount))
                    : 'Aucune'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Utilisations
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedPromo.usageCount || 0}
                  {selectedPromo.maxUsageCount
                    ? ` / ${selectedPromo.maxUsageCount}`
                    : ' (illimité)'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirmation de suppression */}
      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Supprimer cette promotion ?"
        description={`« ${deleteTarget?.title} » sera définitivement supprimée. Les codes déjà utilisés resteront valides pour les commandes en cours.`}
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
