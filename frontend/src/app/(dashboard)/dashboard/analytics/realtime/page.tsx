'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ShoppingBag,
  Calendar,
  CreditCard,
  Star,
  Heart,
  Eye,
  Package,
  Users,
  RefreshCw,
  Search,
  Radio,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/Button';
import { EventDonut, type DonutDatum } from '@/components/dashboard/analytics/EventDonut';
import { cn } from '@/lib/utils';
import {
  useAnalyticsEvents,
  useAnalyticsEventsSummary,
  useAnalyticsBreakdownByType,
  useAnalyticsBreakdownByCategory,
  useAnalyticsEventsCounters,
} from '@/features/afriScoreHooks';

const PERIODS = [
  { value: 7, label: '7 jours' },
  { value: 30, label: '30 jours' },
  { value: 90, label: '90 jours' },
];

const TYPE_META: Record<string, { icon: any; color: string }> = {
  order: { icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' },
  booking: { icon: Calendar, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' },
  payment: { icon: CreditCard, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30' },
  review: { icon: Star, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' },
  favorite: { icon: Heart, color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' },
  page_view: { icon: Eye, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' },
  product: { icon: Package, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' },
  social: { icon: Users, color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30' },
};

const CATEGORY_COLORS: Record<string, string> = {
  commercial: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30',
  navigation: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30',
  dashboard: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30',
  social: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30',
};

function formatTime(iso: string | Date) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatValue(value?: number | null) {
  if (value == null || value === 0) return null;
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
}

/** Types dont la valeur est un montant monétaire (FCFA). Les autres (notes, etc.) s'affichent sans devise. */
const MONEY_TYPES = ['order', 'payment', 'booking'];

function formatEventValue(ev: any) {
  if (ev.value == null || ev.value === 0) return null;
  const formatted = formatValue(ev.value);
  if (MONEY_TYPES.includes(ev.type)) {
    return (
      <>
        {formatted} <span className="text-[10px] text-gray-400">FCFA</span>
      </>
    );
  }
  return <>{formatted}</>;
}

export default function AnalyticsRealtimePage() {
  const [days, setDays] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce 300 ms sur la recherche pour ne pas tirer une requête par frappe
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const refreshMs = autoRefresh ? 30000 : undefined;

  const feed = useAnalyticsEvents(
    {
      type: typeFilter ?? undefined,
      category: categoryFilter ?? undefined,
      search: debouncedSearch || undefined,
      page,
      limit: 20,
    },
    refreshMs
  );
  const summary = useAnalyticsEventsSummary(days, refreshMs);
  const byType = useAnalyticsBreakdownByType(days, refreshMs);
  const byCategory = useAnalyticsBreakdownByCategory(days, refreshMs);
  const counters = useAnalyticsEventsCounters(days, refreshMs);

  const loading = feed.isLoading || summary.isLoading;

  const events = useMemo(
    () => (Array.isArray(feed.data?.events) ? feed.data.events : []),
    [feed.data]
  );
  const total = feed.data?.total ?? 0;
  const totalPages = Math.max(feed.data?.totalPages ?? 1, 1);

  const summaryData = summary.data ?? { total: 0, today: 0, byType: [], byCategory: [] };
  const countersData = counters.data ?? { totals: {}, revenue: 0, eventCount: 0 };

  const typeData: DonutDatum[] = (Array.isArray(byType.data) ? byType.data : []).map((t: any) => ({
    name: t.type,
    value: t.count,
  }));
  const categoryData: DonutDatum[] = (Array.isArray(byCategory.data) ? byCategory.data : []).map(
    (c: any) => ({ name: c.category, value: c.count })
  );

  const lastUpdated = useMemo(() => new Date(), [feed.dataUpdatedAt, summary.dataUpdatedAt]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Flux temps réel"
        description="Toutes les actions de votre écosystème en direct : commandes, réservations, paiements, avis…"
      />

      {/* Barre de contrôle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                days === p.value
                  ? 'bg-brand text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setAutoRefresh((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
            autoRefresh
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
          )}
        >
          <Radio className={cn('h-3.5 w-3.5', autoRefresh && 'animate-pulse')} />
          Auto {autoRefresh ? 'ON' : 'OFF'} · 30s
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => feed.refetch()}
          disabled={feed.isFetching}
        >
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1', feed.isFetching && 'animate-spin')} />
          Rafraîchir
        </Button>

        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          Dernière mise à jour : {lastUpdated.toLocaleTimeString('fr-FR')}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<Activity className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          label={`Événements · ${days} jours`}
          value={formatValue(summaryData.total) ?? 0}
        />
        <StatsCard
          icon={<Radio className="h-5 w-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          label="Aujourd'hui"
          value={formatValue(summaryData.today) ?? 0}
        />
        <StatsCard
          icon={<CreditCard className="h-5 w-5" />}
          iconBg="bg-teal-50 dark:bg-teal-900/30"
          iconColor="text-teal-600"
          label="Valeur trackée"
          value={`${formatValue(countersData.revenue) ?? 0} FCFA`}
        />
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600"
          label="Types d'actions"
          value={Object.keys(countersData.totals ?? {}).length}
        />
      </div>

      {/* Donuts cliquables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EventDonut
          title="Répartition par type"
          data={typeData}
          activeSegment={typeFilter}
          onSegmentClick={(name) => {
            setTypeFilter(name);
            setPage(1);
          }}
        />
        <EventDonut
          title="Répartition par catégorie"
          data={categoryData}
          activeSegment={categoryFilter}
          onSegmentClick={(name) => {
            setCategoryFilter(name);
            setPage(1);
          }}
        />
      </div>

      {/* Filtres + Flux */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un événement (ex: ORDER_PLACED)…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>
          <select
            value={typeFilter ?? ''}
            onChange={(e) => {
              setTypeFilter(e.target.value || null);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="">Tous les types</option>
            {typeData.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter ?? ''}
            onChange={(e) => {
              setCategoryFilter(e.target.value || null);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="">Toutes les catégories</option>
            {categoryData.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-16">
            <Loader label="Chargement du flux…" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            title="Aucun événement"
            description="Les actions de la plateforme (commandes, réservations, paiements, vues…) apparaîtront ici en temps réel."
            action={
              <Button variant="outline" size="sm" onClick={() => feed.refetch()}>
                Recharger
              </Button>
            }
          />
        ) : (
          <>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {events.map((ev: any) => {
                const meta = TYPE_META[ev.type] ?? {
                  icon: Activity,
                  color: 'bg-gray-50 text-gray-500',
                };
                const Icon = meta.icon;
                const valueNode = formatEventValue(ev);
                const props = (ev.properties ?? {}) as Record<string, unknown>;
                const detail = props.orderId
                  ? `Commande #${String(props.orderId).slice(0, 8)}`
                  : props.bookingId
                    ? `Réservation #${String(props.bookingId).slice(0, 8)}`
                    : props.productId
                      ? 'Produit'
                      : props.businessId
                        ? 'Business'
                        : null;
                return (
                  <li key={ev.id} className="py-3 flex items-start gap-3">
                    <span
                      className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        meta.color
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {ev.eventName}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize',
                            CATEGORY_COLORS[ev.category] ??
                              'bg-gray-100 text-gray-500 dark:bg-gray-800'
                          )}
                        >
                          {ev.category ?? ev.type}
                        </span>
                        {detail && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">{detail}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatTime(ev.occurredAt)}
                      </p>
                    </div>
                    {valueNode && (
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                        {valueNode}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {total} événement{total > 1 ? 's' : ''} · page {page}/{totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  ← Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant →
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
