'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  ShoppingBag,
  DollarSign,
  Printer,
  Mail,
  FileSpreadsheet,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  FINANCIAL: {
    label: 'Financier',
    icon: DollarSign,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  },
  ACTIVITY: {
    label: 'Activité',
    icon: TrendingUp,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  },
  GROWTH: {
    label: 'Croissance',
    icon: BarChart3,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
  },
  USERS: {
    label: 'Utilisateurs',
    icon: Users,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  },
  MODULES: {
    label: 'Modules',
    icon: Building2,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30',
  },
  CUSTOM: {
    label: 'Personnalisé',
    icon: FileText,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30',
  },
};

const FORMAT_ICONS: Record<string, any> = { PDF: FileText, EXCEL: FileSpreadsheet, CSV: FileText };

const QUICK_REPORTS = [
  { label: 'Rapport financier mensuel', type: 'FINANCIAL', icon: DollarSign },
  { label: "Rapport d'activité", type: 'ACTIVITY', icon: TrendingUp },
  { label: 'Top utilisateurs', type: 'USERS', icon: Users },
  { label: 'Performance modules', type: 'MODULES', icon: ShoppingBag },
];

export default function AdminReportsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 15;

  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-reports', typeFilter, page],
    queryFn: async () => {
      const res = await apiClient.adminGetReports({
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        page,
        limit,
      });
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const reports = reportsData?.items ?? [];
  const totalPages =
    reportsData?.totalPages ?? Math.max(1, Math.ceil((reportsData?.total ?? 0) / limit));

  const filtered = search
    ? reports.filter((r: any) => r.title?.toLowerCase().includes(search.toLowerCase()))
    : reports;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Rapports
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Rapports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Générez et consultez les rapports de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Calendar className="h-4 w-4 mr-1.5" />
            Planifier
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-1.5" />
            Nouveau rapport
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_REPORTS.map((qr) => {
          const Icon = qr.icon;
          return (
            <button
              key={qr.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                {qr.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un rapport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {[
            { value: 'ALL', label: 'Tous' },
            { value: 'FINANCIAL', label: 'Financiers' },
            { value: 'ACTIVITY', label: 'Activité' },
            { value: 'GROWTH', label: 'Croissance' },
            { value: 'USERS', label: 'Utilisateurs' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setTypeFilter(f.value);
                setPage(1);
              }}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                typeFilter === f.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loader className="py-20" />
      ) : (
        <Card padding="none">
          {filtered.length > 0 ? (
            <div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((report: any) => {
                  const typeConf = TYPE_CONFIG[report.type] || TYPE_CONFIG.CUSTOM;
                  const TypeIcon = typeConf.icon;
                  const FormatIcon = FORMAT_ICONS[report.format || 'PDF'] || FileText;
                  return (
                    <div
                      key={report.id}
                      className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('p-3 rounded-xl shrink-0', typeConf.color)}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {report.title}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {report.description || '—'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {report.status === 'GENERATING' ? (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                  Génération...
                                </span>
                              ) : report.status === 'FAILED' ? (
                                <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                  Échec
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                  Prêt
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {report.periodStart
                                ? new Date(report.periodStart).toLocaleDateString('fr-FR')
                                : '—'}
                            </span>
                            <span className="flex items-center gap-1">
                              <FormatIcon className="h-3 w-3" />
                              {report.format || 'PDF'}
                            </span>
                            {report.fileUrl && (
                              <span className="text-xs text-gray-400">
                                {report.fileUrl.split('.').pop()?.toUpperCase()}
                              </span>
                            )}
                            <span>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            {report.status === 'COMPLETED' && (
                              <>
                                <Button variant="secondary" size="xs">
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  Visualiser
                                </Button>
                                <Button variant="secondary" size="xs">
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  Télécharger
                                </Button>
                                <Button variant="ghost" size="xs">
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="xs">
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {report.status === 'GENERATING' && (
                              <span className="text-xs text-amber-600">
                                En cours de génération...
                              </span>
                            )}
                            {report.status === 'FAILED' && (
                              <Button variant="ghost" size="xs" className="text-red-500">
                                Réessayer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg transition-colors',
                        p === page
                          ? 'bg-brand text-white'
                          : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Aucun rapport trouvé
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search ? 'Essayez une autre recherche' : 'Générez votre premier rapport'}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
