'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Package,
  ArrowUpRight,
  BarChart3,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const MODULE_LABELS: Record<string, string> = {
  PRODUCTS: 'Produits',
  SERVICES: 'Services',
  MENU: 'Menu / Carte',
  ROOMS: 'Chambres / Hébergement',
  BOOKINGS: 'Réservations',
  ORDERS: 'Commandes',
  QUOTES_INVOICES: 'Devis & Factures',
  DEBTS_PAYMENTS: 'Dettes & Paiements',
  PROMOTIONS: 'Promotions',
  PLANNING: 'Planning',
  EMPLOYEES: 'Employés',
  PORTFOLIO: 'Portfolio',
  SUBSCRIPTIONS: 'Abonnements',
  DELIVERIES: 'Livraisons',
  EVENTS: 'Événements',
  RENTALS: 'Locations',
  DOCUMENTS: 'Documents',
  PARTNERS: 'Partenaires',
  DISPUTES: 'Litiges',
  MODULE_MARKETPLACE: 'Marketplace Développeurs',
  TRAINING: 'Formations',
  ADVANCED_TASKS: 'Tâches avancées',
};

const MODULE_COLORS: Record<string, string> = {
  ACTIVE:
    'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  INACTIVE: 'text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
  PENDING_MIGRATION:
    'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  PENDING_MIGRATION: 'En attente de migration',
};

export default function ModuleAnalysisPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['business', 'modules', 'analysis'],
    queryFn: async () => {
      const res = await apiClient.get('/business/modules/analysis');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto" />
          <p className="text-sm text-gray-500">Analyse des modules en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-sm text-gray-500">Erreur lors du chargement de l&apos;analyse</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-12 w-12" />}
        title="Aucune donnée d'analyse"
        description="Les statistiques de vos modules apparaîtront ici une fois configurés."
      />
    );
  }

  const modules = Array.isArray(data.modules) ? data.modules : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Analyse des modules"
            description="Vue d'ensemble de tous vos modules business — statuts, migration et configuration"
            gradient
          />
        </div>
        <Link href="/dashboard/marketplace">
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-1.5" />
            Marketplace
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30">
              <Package className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.totalModules}
              </p>
              <p className="text-xs text-gray-500">Total modules</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{data.activeCount}</p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
              <XCircle className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{data.inactiveCount}</p>
              <p className="text-xs text-gray-500">Inactifs</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2.5 rounded-xl',
                data.pendingMigrationCount > 0
                  ? 'bg-amber-50 dark:bg-amber-900/30'
                  : 'bg-gray-50 dark:bg-gray-800'
              )}
            >
              <AlertTriangle
                className={cn(
                  'h-5 w-5',
                  data.pendingMigrationCount > 0 ? 'text-amber-600' : 'text-gray-400'
                )}
              />
            </div>
            <div>
              <p
                className={cn(
                  'text-2xl font-bold',
                  data.pendingMigrationCount > 0 ? 'text-amber-600' : 'text-gray-500'
                )}
              >
                {data.pendingMigrationCount}
              </p>
              <p className="text-xs text-gray-500">En migration</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending migration alert */}
      {data.pendingMigrationCount > 0 && (
        <Card className="p-4 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {data.pendingMigrationCount} module{data.pendingMigrationCount > 1 ? 's' : ''} en
                attente de migration
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Ces modules sont présents dans l&apos;ancien système mais pas encore migrés vers le
                nouveau.
                {Array.isArray(data.pendingMigration) && data.pendingMigration.length > 0 && (
                  <span className="block mt-2 font-mono text-[11px]">
                    {data.pendingMigration.map((m: string) => MODULE_LABELS[m] || m).join(', ')}
                  </span>
                )}
              </p>
              <div className="mt-3">
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={async () => {
                    await apiClient.post('/business/modules/analysis/migrate');
                    refetch();
                  }}
                >
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Lancer la migration
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Module list */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Détail des modules
          </h3>
          <Badge variant="brand" size="xs">
            {modules.length}
          </Badge>
        </div>

        {modules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aucun module configuré</p>
        ) : (
          <div className="space-y-2">
            {modules.map((mod: any) => {
              const status = mod.status || 'PENDING_MIGRATION';
              const label = MODULE_LABELS[mod.module] || mod.module;
              const colorClass = MODULE_COLORS[status] || MODULE_COLORS.PENDING_MIGRATION;

              return (
                <div
                  key={mod.module}
                  className={cn(
                    'flex items-center justify-between p-3.5 rounded-xl border transition-all hover:shadow-sm',
                    colorClass
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-2.5 h-2.5 rounded-full shrink-0',
                        status === 'ACTIVE'
                          ? 'bg-emerald-500'
                          : status === 'INACTIVE'
                            ? 'bg-gray-300 dark:bg-gray-600'
                            : 'bg-amber-500'
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {label}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                        {mod.module}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span
                      className={cn(
                        'text-[11px] font-medium px-2 py-0.5 rounded-full',
                        status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : status === 'INACTIVE'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      )}
                    >
                      {STATUS_LABELS[status] || status}
                    </span>

                    {mod.activatedAt && (
                      <span className="text-[10px] text-gray-400 hidden sm:block">
                        {new Date(mod.activatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}

                    <Link
                      href={`/dashboard/marketplace`}
                      className="text-gray-400 hover:text-brand transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Conversion info */}
      {data.totalModules > 0 && (
        <Card className="p-4 bg-gradient-to-br from-brand-50 to-transparent dark:from-brand-900/10 dark:to-transparent border-brand/10">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Taux d&apos;activation
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.totalModules > 0
                  ? `${Math.round((data.activeCount / data.totalModules) * 100)}% de vos modules sont actifs`
                  : 'Aucun module configuré'}
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs">
                <div
                  className="bg-brand rounded-full h-2 transition-all duration-500"
                  style={{
                    width: `${data.totalModules > 0 ? (data.activeCount / data.totalModules) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
