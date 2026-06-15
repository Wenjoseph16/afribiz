'use client';

import { useState } from 'react';
import {
  Code2, Shield, Search, DollarSign, TrendingUp, Download, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '1y', label: '1 an' },
  { value: 'all', label: 'Tout' },
];

function formatCurrency(amount: number) {
  return `${amount.toLocaleString()} FCFA`;
}

export default function DeveloperCommissionsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [period, setPeriod] = useState('30d');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: devCommissions, isLoading } = useQuery({
    queryKey: ['admin', 'developers', 'commissions', period, page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/developers/commissions', {
        params: { period, page, limit, search: search || undefined },
      });
      return res.data.data || { developers: [], totalPages: 1, stats: null };
    },
    enabled: isAdmin,
  });

  const developers = Array.isArray(devCommissions?.developers) ? devCommissions.developers : [];
  const totalPages = devCommissions?.totalPages || 1;
  const stats = devCommissions?.stats || null;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Commissions développeurs</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Commissions développeurs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivi des revenus et commissions prélevées sur les ventes de modules
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Revenu total développeurs</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.totalDeveloperRevenue || 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Commission AfriBiz</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.totalPlatformCommission || 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Code2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Modules vendus</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalSales || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un développeur..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setPeriod(p.value); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === p.value
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Loader className="py-20" />
      ) : developers.length === 0 ? (
        <EmptyState
          icon={<Code2 className="h-8 w-8" />}
          title="Aucune commission"
          description="Aucune commission développeur pour cette période."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3 font-medium">Développeur</th>
                <th className="p-3 font-medium">Modules</th>
                <th className="p-3 font-medium">Ventes</th>
                <th className="p-3 font-medium">Revenu brut</th>
                <th className="p-3 font-medium">Commission (20%)</th>
                <th className="p-3 font-medium">Revenu net</th>
              </tr>
            </thead>
            <tbody>
              {developers.map((dev: any) => (
                <tr key={dev.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-600">
                        {dev.name?.[0]?.toUpperCase() || 'D'}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{dev.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-500">{dev.moduleCount || 0}</td>
                  <td className="p-3">
                    <span className="font-semibold">{dev.totalSales || 0}</span>
                  </td>
                  <td className="p-3 text-gray-900 dark:text-gray-100 font-medium">
                    {formatCurrency(dev.grossRevenue || 0)}
                  </td>
                  <td className="p-3">
                    <span className="text-amber-600 font-medium">
                      {formatCurrency(dev.commission || 0)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-emerald-600 font-semibold">
                      {formatCurrency(dev.netRevenue || 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} sur {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
