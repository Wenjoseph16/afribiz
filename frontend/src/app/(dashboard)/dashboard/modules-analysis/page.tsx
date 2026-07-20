'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Puzzle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  RefreshCw,
  Calendar,
  Zap,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const MODULE_LABELS: Record<string, { name: string; color: string }> = {
  PRODUCTS: { name: 'Produits', color: 'text-blue-600' },
  SERVICES: { name: 'Services', color: 'text-purple-600' },
  MENU: { name: 'Menu / Carte', color: 'text-orange-600' },
  BOOKINGS: { name: 'Réservations', color: 'text-amber-600' },
  ROOMS: { name: 'Chambres', color: 'text-teal-600' },
  ORDERS: { name: 'Commandes', color: 'text-emerald-600' },
  EVENTS: { name: 'Événements', color: 'text-red-600' },
  RENTALS: { name: 'Locations', color: 'text-indigo-600' },
  PROMOTIONS: { name: 'Promotions', color: 'text-pink-600' },
  PORTFOLIO: { name: 'Portfolio', color: 'text-rose-600' },
  DELIVERIES: { name: 'Livraisons', color: 'text-yellow-600' },
  EMPLOYEES: { name: 'Employés', color: 'text-cyan-600' },
  PLANNING: { name: 'Planning', color: 'text-sky-600' },
  QUOTES_INVOICES: { name: 'Devis & Factures', color: 'text-violet-600' },
  DEBTS_PAYMENTS: { name: 'Dettes & Paiements', color: 'text-orange-600' },
  SUBSCRIPTIONS: { name: 'Abonnements', color: 'text-emerald-600' },
  DOCUMENTS: { name: 'Documents', color: 'text-gray-600' },
  PARTNERS: { name: 'Partenaires', color: 'text-blue-600' },
  DISPUTES: { name: 'Litiges', color: 'text-red-600' },
  MODULE_MARKETPLACE: { name: 'Marketplace Développeurs', color: 'text-indigo-600' },
  TRAINING: { name: 'Formations', color: 'text-green-600' },
  ADVANCED_TASKS: { name: 'Tâches avancées', color: 'text-purple-600' },
};

const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Actif',
    variant: 'success' as const,
    icon: CheckCircle2,
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  INACTIVE: {
    label: 'Inactif',
    variant: 'danger' as const,
    icon: XCircle,
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
  },
  PENDING_MIGRATION: {
    label: 'Migration en attente',
    variant: 'warning' as const,
    icon: Clock,
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

export default function ModuleAnalysisPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['business', 'moduleAnalysis'],
    queryFn: async () => {
      const res = await apiClient.getModuleAnalysis();
      return res.data?.data as {
        businessName: string;
        totalModules: number;
        activeCount: number;
        inactiveCount: number;
        pendingMigrationCount: number;
        pendingMigration: string[];
        modules: Array<{
          module: string;
          status: 'ACTIVE' | 'INACTIVE' | 'PENDING_MIGRATION';
          activatedAt: string | null;
          deactivatedAt: string | null;
          config: any | null;
        }>;
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader label="Analyse des modules en cours..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Analyse des modules"
          description="Diagnostic des modules installés sur votre business"
          gradient
        />
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title="Erreur de chargement"
          description="Impossible de charger l'analyse des modules. Vérifiez que votre business est bien configuré."
          action={
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analyse des modules"
        description={`Diagnostic des ${data.totalModules} modules de ${data.businessName}`}
        gradient
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Layers className="h-5 w-5" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          iconColor="text-indigo-600"
          label="Modules totaux"
          value={data.totalModules}
        />
        <StatsCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          label="Modules actifs"
          value={data.activeCount}
          trend={
            data.activeCount > 0
              ? {
                  value: `${Math.round((data.activeCount / Math.max(data.totalModules, 1)) * 100)}%`,
                  positive: true,
                }
              : undefined
          }
        />
        <StatsCard
          icon={<XCircle className="h-5 w-5" />}
          iconBg="bg-red-50 dark:bg-red-900/30"
          iconColor="text-red-600"
          label="Inactifs"
          value={data.inactiveCount}
          trend={
            data.inactiveCount > 0
              ? { value: `${data.inactiveCount} désactivé(s)`, positive: false }
              : undefined
          }
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600"
          label="En migration"
          value={data.pendingMigrationCount}
          trend={
            data.pendingMigrationCount > 0
              ? { value: `${data.pendingMigrationCount} en attente`, positive: false }
              : undefined
          }
        />
      </div>

      {/* Pending Migration Alert */}
      {data.pendingMigrationCount > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Modules en attente de migration
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {data.pendingMigrationCount} module(s) sont présents dans l'ancien système mais pas
                encore dans le nouveau système d'assignations. Lancez le script de migration pour
                les synchroniser.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {data.pendingMigration.map((mod: string) => (
                  <span
                    key={mod}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-xs font-medium text-amber-700 dark:text-amber-400"
                  >
                    <Clock className="h-3 w-3" />
                    {MODULE_LABELS[mod]?.name || mod}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Module Detail Table */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Détail des modules
            </h3>
          </div>
          <Badge variant="default" size="xs">
            {data.modules.length} module(s)
          </Badge>
        </div>

        <div className="space-y-2">
          {data.modules.map((mod) => {
            const config = STATUS_CONFIG[mod.status] || STATUS_CONFIG.PENDING_MIGRATION;
            const label = MODULE_LABELS[mod.module];
            const StatusIcon = config.icon;

            return (
              <div
                key={mod.module}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-xl border transition-all',
                  config.bg,
                  config.border
                )}
              >
                {/* Module icon + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      label?.color || 'text-gray-600',
                      'bg-white dark:bg-gray-800'
                    )}
                  >
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {label?.name || mod.module}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                      {mod.module}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="hidden sm:block text-right">
                  {mod.activatedAt && mod.status === 'ACTIVE' && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Activé le{' '}
                      {new Date(mod.activatedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  {mod.deactivatedAt && (
                    <p className="text-[11px] text-red-500">
                      Désactivé le{' '}
                      {new Date(mod.deactivatedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  )}
                </div>

                {/* Status badge */}
                <Badge variant={config.variant} size="sm" className="shrink-0">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            );
          })}
        </div>

        {data.modules.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun module configuré</p>
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">Actif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-gray-500">Inactif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-500">Migration en attente</span>
        </div>
      </div>
    </div>
  );
}
