'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Download, TrendingUp, TrendingDown, Users, Calendar, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { useDeveloperInstallations } from '@/features/developerHooks';
import type { DeveloperModuleInstallation } from '@/types/developer';

const TABS = [
  { id: undefined, label: 'Toutes' },
  { id: 'ACTIVE', label: 'Actives' },
  { id: 'DISABLED', label: 'Désactivées' },
  { id: 'UNINSTALLED', label: 'Désinstallées' },
] as const;

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ACTIVE: 'success',
  DISABLED: 'warning',
  UNINSTALLED: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  DISABLED: 'Désactivée',
  UNINSTALLED: 'Désinstallée',
};

export default function DeveloperInstallationsPage() {
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: installationsData, isLoading, error, refetch } = useDeveloperInstallations(filter);

  const installations = useMemo(() => {
    if (!installationsData) return [];
    return Array.isArray(installationsData) ? installationsData : (installationsData.installations || installationsData.data || []);
  }, [installationsData]);

  const stats = useMemo(() => {
    const active = installations.filter((i: DeveloperModuleInstallation) => i.status === 'ACTIVE');
    const disabled = installations.filter((i: DeveloperModuleInstallation) => i.status === 'DISABLED');
    const uninstalled = installations.filter((i: DeveloperModuleInstallation) => i.status === 'UNINSTALLED');
    const retention = installations.length > 0 ? Math.round((active.length / installations.length) * 100) : 0;
    return { total: installations.length, active: active.length, disabled: disabled.length, uninstalled: uninstalled.length, retention };
  }, [installations]);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des installations..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Installations"
        description="Suivez l'installation de vos modules chez les business"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Installations' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Installations totales</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Actives</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.uninstalled}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Désinstallations</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.retention}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Taux rétention</p>
        </Card>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Liste des installations</h3>
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                  filter === tab.id ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {installations.length === 0 ? (
          <EmptyState
            icon={<Download className="h-10 w-10" />}
            title="Aucune installation"
            description="Les installations de vos modules apparaîtront ici."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Business</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Module</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Version</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Installé le</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">MàJ auto</th>
                </tr>
              </thead>
              <tbody>
                {installations.map((inst: DeveloperModuleInstallation) => (
                  <tr key={inst.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {inst.business?.logo ? (
                          <Image src={inst.business.logo ?? ''} alt="" width={28} height={28} className="rounded-lg object-cover" unoptimized />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center text-[10px] font-bold text-brand">
                            {(inst.business?.name || 'B')[0]}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{inst.business?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{inst.module?.name || '—'}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 font-mono text-xs">v{inst.version || '—'}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {inst.installedAt ? new Date(inst.installedAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={STATUS_VARIANTS[inst.status] || 'default'} size="xs">
                        {STATUS_LABELS[inst.status] || inst.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {inst.autoUpdate ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <ToggleRight className="h-4 w-4" /> Activée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
                          <ToggleLeft className="h-4 w-4" /> Désactivée
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
