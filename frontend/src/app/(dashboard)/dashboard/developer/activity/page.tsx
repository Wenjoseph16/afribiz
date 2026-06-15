'use client';

import { useState, useMemo } from 'react';
import {
  Activity as ActivityIcon, Clock, RefreshCw,
  Package, Download, DollarSign, Star, UserPlus, Settings,
  Shield, AlertTriangle, CheckCircle, XCircle, MessageCircle,
  FileText, Key, Wifi, CreditCard, Ban,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModules } from '@/features/developerHooks';
import { useModuleActivity, useDeveloperActivityFeed, useActivityStats } from '@/features/developerModulesHooks';
import type { ModuleActivityLog } from '@/types/developer';

const ACTIVITY_ICONS: Record<string, typeof ActivityIcon> = {
  MODULE_INSTALLED: Download,
  MODULE_UNINSTALLED: XCircle,
  MODULE_UPDATED: Package,
  MODULE_SOLD: DollarSign,
  MODULE_REVIEWED: Star,
  MODULE_LICENSE_CREATED: Key,
  MODULE_LICENSE_ACTIVATED: CheckCircle,
  MODULE_LICENSE_EXPIRED: AlertTriangle,
  MODULE_LICENSE_REVOKED: Ban,
  MODULE_CONFIG_UPDATED: Settings,
  MODULE_VALIDATION_SUBMITTED: Shield,
  MODULE_VALIDATION_APPROVED: CheckCircle,
  MODULE_VALIDATION_REJECTED: XCircle,
  MODULE_ERROR: AlertTriangle,
  TICKET_CREATED: MessageCircle,
  TICKET_RESOLVED: CheckCircle,
  PAYOUT_REQUESTED: CreditCard,
  WEBHOOK_SENT: Wifi,
  CLIENT_ADDED: UserPlus,
  FILE_EXPORTED: FileText,
};

const ACTIVITY_COLORS: Record<string, string> = {
  MODULE_INSTALLED: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  MODULE_UNINSTALLED: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  MODULE_UPDATED: 'text-brand bg-brand-50 dark:bg-brand-900/30',
  MODULE_SOLD: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  MODULE_REVIEWED: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  MODULE_LICENSE_CREATED: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
  MODULE_LICENSE_ACTIVATED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  MODULE_LICENSE_EXPIRED: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  MODULE_LICENSE_REVOKED: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  MODULE_CONFIG_UPDATED: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
  MODULE_VALIDATION_SUBMITTED: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  MODULE_VALIDATION_APPROVED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  MODULE_VALIDATION_REJECTED: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  MODULE_ERROR: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  TICKET_CREATED: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
  TICKET_RESOLVED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  PAYOUT_REQUESTED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  WEBHOOK_SENT: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  CLIENT_ADDED: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
  FILE_EXPORTED: 'text-gray-600 bg-gray-100 dark:bg-gray-800',
};

const ACTIVITY_LABELS: Record<string, string> = {
  MODULE_INSTALLED: 'Module installé',
  MODULE_UNINSTALLED: 'Module désinstallé',
  MODULE_UPDATED: 'Module mis à jour',
  MODULE_SOLD: 'Vente de module',
  MODULE_REVIEWED: 'Nouvel avis',
  MODULE_LICENSE_CREATED: 'Licence créée',
  MODULE_LICENSE_ACTIVATED: 'Licence activée',
  MODULE_LICENSE_EXPIRED: 'Licence expirée',
  MODULE_LICENSE_REVOKED: 'Licence révoquée',
  MODULE_CONFIG_UPDATED: 'Configuration mise à jour',
  MODULE_VALIDATION_SUBMITTED: 'Soumis en validation',
  MODULE_VALIDATION_APPROVED: 'Validation approuvée',
  MODULE_VALIDATION_REJECTED: 'Validation rejetée',
  MODULE_ERROR: 'Erreur détectée',
  TICKET_CREATED: 'Ticket créé',
  TICKET_RESOLVED: 'Ticket résolu',
  PAYOUT_REQUESTED: 'Paiement demandé',
  WEBHOOK_SENT: 'Webhook envoyé',
  CLIENT_ADDED: 'Nouveau client',
  FILE_EXPORTED: 'Export effectué',
};

function getActivityIcon(type: string) {
  return ACTIVITY_ICONS[type] || ActivityIcon;
}

function getActivityColor(type: string) {
  return ACTIVITY_COLORS[type] || 'text-gray-600 bg-gray-100 dark:bg-gray-800';
}

function getActivityLabel(type: string) {
  return ACTIVITY_LABELS[type] || type;
}

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function DeveloperActivityPage() {
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [viewMode, setViewMode] = useState<'feed' | 'module'>('feed');

  const { data: modules, isLoading: modulesLoading } = useDeveloperModules();
  const { data: feed, isLoading: feedLoading, error: feedError, refetch: refetchFeed } = useDeveloperActivityFeed(50);
  const { data: moduleActivity, isLoading: moduleLoading, error: moduleError, refetch: refetchModule } = useModuleActivity(selectedModuleId, 50);
  const { data: activityStats, isLoading: statsLoading } = useActivityStats(selectedModuleId);

  const moduleList = useMemo(() => {
    if (!modules) return [];
    return Array.isArray(modules) ? modules : (modules.modules || modules.data || []);
  }, [modules]);

  const activityList = useMemo(() => {
    const list = viewMode === 'feed' ? feed : moduleActivity;
    if (!list) return [];
    return Array.isArray(list) ? list : [];
  }, [viewMode, feed, moduleActivity]);

  const statsByType = useMemo(() => {
    if (!activityStats?.byType) return [];
    return activityStats.byType;
  }, [activityStats]);

  const isLoading = viewMode === 'feed' ? feedLoading : moduleLoading;
  const error = viewMode === 'feed' ? feedError : moduleError;
  const refetch = viewMode === 'feed' ? refetchFeed : refetchModule;

  if (modulesLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Journal d'Activité"
        description="Suivez toute l'activité de vos modules en temps réel"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Activité' },
        ]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        }
      />

      {/* View mode + module selector */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setViewMode('feed')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
              viewMode === 'feed'
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            Fil d'activité
          </button>
          <button
            onClick={() => { setViewMode('module'); setSelectedModuleId(selectedModuleId || moduleList[0]?.id || ''); }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
              viewMode === 'module'
                ? 'bg-brand text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            Par module
          </button>
        </div>

        {viewMode === 'module' && (
          <select
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            {moduleList.map((mod: any) => (
              <option key={mod.id} value={mod.id}>{mod.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats row */}
      {viewMode === 'module' && statsByType.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1">Activité par type :</span>
          {statsByType.map((s: any) => (
            <span key={s.activityType} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {s.activityType.replace('MODULE_', '')} <span className="font-bold">{s._count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Activity list */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : activityList.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {activityList.map((log: ModuleActivityLog, idx: number) => {
              const Icon = getActivityIcon(log.activityType);
              return (
                <div key={log.id || idx} className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className={cn('p-2.5 rounded-xl shrink-0', getActivityColor(log.activityType))}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getActivityLabel(log.activityType)}
                        </p>
                        {log.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {log.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                      {log.module?.name && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {log.module.name}
                        </span>
                      )}
                      {log.business?.name && (
                        <span className="flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          {log.business.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<ActivityIcon className="h-8 w-8" />}
            title="Aucune activité"
            description="Le journal d'activité apparaîtra ici une fois que des événements se produiront."
          />
        )}
      </Card>
    </div>
  );
}
