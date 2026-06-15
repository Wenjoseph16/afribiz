'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Settings, ToggleLeft, ToggleRight, Search,
  Eye, Clock, CheckCircle2, XCircle, Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useModuleConfigurations } from '@/features/developerModulesHooks';
import type { ModuleConfiguration } from '@/types/developer';
import Link from 'next/link';

export default function ModuleConfigurationPage() {
  const params = useParams();
  const moduleId = params?.id as string;

  const { data: configs, isLoading, error, refetch } = useModuleConfigurations(moduleId);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const configList = useMemo(() => {
    if (!configs) return [];
    let list = Array.isArray(configs) ? configs : [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c: ModuleConfiguration) =>
        c.business?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [configs, search]);

  const stats = useMemo(() => {
    const active = configList.filter((c: ModuleConfiguration) => c.isActive).length;
    const inactive = configList.filter((c: ModuleConfiguration) => !c.isActive).length;
    return { total: configList.length, active, inactive };
  }, [configList]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Configuration du module</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gérez les configurations de ce module pour chaque business
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Settings className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><ToggleRight className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Actives</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500"><ToggleLeft className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Inactives</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.inactive}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
      </div>

      {/* Configurations list */}
      {configList.length === 0 ? (
        <EmptyState
          icon={<Settings className="h-10 w-10" />}
          title="Aucune configuration"
          description={search ? 'Aucun business ne correspond à la recherche.' : 'Ce module n\'a pas encore été configuré par des business.'}
        />
      ) : (
        <div className="space-y-3">
          {configList.map((cfg: ModuleConfiguration) => (
            <Card key={cfg.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpandedId(expandedId === cfg.id ? null : cfg.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      cfg.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      {cfg.business?.logo ? (
                        <Image src={cfg.business.logo ?? ''} alt="" fill className="object-cover rounded-xl" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                      ) : (
                        <Globe className={cn('h-5 w-5', cfg.isActive ? 'text-emerald-600' : 'text-gray-400')} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {cfg.business?.name || 'Business inconnu'}
                        </span>
                        <Badge variant={cfg.isActive ? 'success' : 'default'} size="xs">
                          {cfg.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                        {cfg.installation?.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Installé le {new Date(cfg.installation.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {cfg.installation?.status === 'ACTIVE' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {cfg.installation?.status || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="xs">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded settings */}
              {expandedId === cfg.id && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="pt-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Configuration
                    </h4>
                    {cfg.settings && Object.keys(cfg.settings).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(cfg.settings).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <Settings className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{key}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">Aucune configuration personnalisée</p>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        Mis à jour le {cfg.updatedAt ? new Date(cfg.updatedAt).toLocaleDateString('fr-FR') : '—'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg',
                          cfg.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        )}>
                          {cfg.isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                          {cfg.isActive ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
