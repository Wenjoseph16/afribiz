'use client';

import { useState } from 'react';
import {
  History, Shield, Search, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  UPDATE: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (val < 1) return `${(val * 100).toFixed(1)}%`;
    return val.toLocaleString() + ' FCFA';
  }
  return String(val);
}

export default function MonetizationAuditPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [search, setSearch] = useState('');

  const { data: logsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'monetization', 'audit'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/monetization/audit');
      return res.data.data || [];
    },
    enabled: isAdmin,
  });

  const logs = Array.isArray(logsData) ? logsData : [];

  const filteredLogs = logs.filter((log: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.details?.key?.toLowerCase().includes(q) ||
      log.createdBy?.toLowerCase().includes(q) ||
      log.details?.action?.toLowerCase().includes(q)
    );
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Audit de monétisation</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Audit de monétisation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Historique des modifications des taux de commission et paramètres de monétisation
          </p>
        </div>
      </div>

      <Card padding="md">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par paramètre, utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </Card>

      {isLoading ? (
        <Loader className="py-20" />
      ) : error ? (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
          title="Erreur de chargement"
          description="Impossible de charger les logs d'audit."
        />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<History className="h-8 w-8" />}
          title="Aucun log d'audit"
          description={
            search
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Les modifications des taux de monétisation seront enregistrées ici.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log: any) => {
            const details = log.details || {};
            const actionType = details.action || 'UPDATE';
            return (
              <Card key={log.id} padding="md">
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 p-1.5 rounded-full ${
                    actionType === 'CREATE' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    actionType === 'DELETE' ? 'bg-red-100 dark:bg-red-900/30' :
                    'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <CheckCircle className={`h-4 w-4 ${
                      actionType === 'CREATE' ? 'text-emerald-600' :
                      actionType === 'DELETE' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={actionType === 'CREATE' ? 'success' : actionType === 'DELETE' ? 'danger' : 'info'} size="xs">
                        {actionType}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {details.key || 'Paramètre'}
                      </span>
                      <span className="text-xs text-gray-400">par</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{log.createdBy}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Ancienne valeur</span>
                        <p className="font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 mt-0.5">
                          {formatValue(details.oldValue)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Nouvelle valeur</span>
                        <p className="font-mono text-brand font-medium bg-brand/5 rounded px-2 py-1 mt-0.5">
                          {formatValue(details.newValue)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(log.createdAt)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
