'use client';

import { useState } from 'react';
import {
  FileText, Download, Eye, Calendar, Filter, Search, BarChart3,
  PieChart, TrendingUp, Users, Building2, ShoppingBag, DollarSign,
  ChevronDown, Printer, Mail, FileSpreadsheet, Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface Report {
  id: string;
  title: string;
  type: 'FINANCIAL' | 'ACTIVITY' | 'GROWTH' | 'USERS' | 'MODULES' | 'CUSTOM';
  period: string;
  generatedAt: string;
  format: 'PDF' | 'EXCEL' | 'CSV';
  status: 'COMPLETED' | 'GENERATING' | 'FAILED';
  size: string;
  description: string;
  author: string;
}

const REPORTS: Report[] = [
  { id: 'r1', title: 'Rapport financier mensuel', type: 'FINANCIAL', period: 'Mai 2026', generatedAt: '2026-06-01T08:00:00', format: 'PDF', status: 'COMPLETED', size: '2.4 MB', description: 'Revenus, commissions, taxes et bénéfices', author: 'Système' },
  { id: 'r2', title: 'Rapport activité plateforme', type: 'ACTIVITY', period: 'Juin 2026', generatedAt: '2026-06-15T10:30:00', format: 'PDF', status: 'COMPLETED', size: '3.1 MB', description: 'Commandes, réservations, transactions', author: 'Système' },
  { id: 'r3', title: 'Croissance Q2 2026', type: 'GROWTH', period: 'Q2 2026', generatedAt: '2026-07-01T00:00:00', format: 'EXCEL', status: 'GENERATING', size: '—', description: 'Indicateurs de croissance trimestriels', author: 'Admin' },
  { id: 'r4', title: 'Analyse utilisateurs', type: 'USERS', period: '2026', generatedAt: '2026-06-10T14:00:00', format: 'CSV', status: 'COMPLETED', size: '856 KB', description: 'Inscriptions, rôles, pays, rétention', author: 'Système' },
  { id: 'r5', title: 'Performance modules marketplace', type: 'MODULES', period: 'S1 2026', generatedAt: '2026-06-20T09:00:00', format: 'PDF', status: 'COMPLETED', size: '5.2 MB', description: 'Top modules, revenus développeurs, installs', author: 'Admin' },
  { id: 'r6', title: 'Rapport personnalisé - Escrow', type: 'CUSTOM', period: 'Juin 2026', generatedAt: '2026-06-18T11:00:00', format: 'PDF', status: 'FAILED', size: '—', description: 'Transactions escrow et litiges', author: 'Admin' },
];

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  FINANCIAL: { label: 'Financier', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  ACTIVITY: { label: 'Activité', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  GROWTH: { label: 'Croissance', icon: BarChart3, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
  USERS: { label: 'Utilisateurs', icon: Users, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  MODULES: { label: 'Modules', icon: Building2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
  CUSTOM: { label: 'Personnalisé', icon: FileText, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
};

const FORMAT_ICONS: Record<string, any> = { PDF: FileText, EXCEL: FileSpreadsheet, CSV: FileText };

const QUICK_REPORTS = [
  { label: 'Rapport financier mensuel', type: 'FINANCIAL', icon: DollarSign },
  { label: 'Rapport d\'activité', type: 'ACTIVITY', icon: TrendingUp },
  { label: 'Top utilisateurs', type: 'USERS', icon: Users },
  { label: 'Performance modules', type: 'MODULES', icon: ShoppingBag },
];

export default function AdminReportsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filtered = REPORTS.filter((r) => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Rapports</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur pour accéder à cette page." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Rapports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Générez et consultez les rapports de la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Calendar className="h-4 w-4 mr-1.5" />Planifier
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-1.5" />Nouveau rapport
          </Button>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_REPORTS.map((qr) => {
          const Icon = qr.icon;
          return (
            <button key={qr.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all group">
              <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">{qr.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un rapport..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {[
            { value: 'ALL', label: 'Tous' },
            { value: 'FINANCIAL', label: 'Financiers' },
            { value: 'ACTIVITY', label: 'Activité' },
            { value: 'GROWTH', label: 'Croissance' },
            { value: 'USERS', label: 'Utilisateurs' },
          ].map((f) => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                typeFilter === f.value ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      <Card padding="none">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((report) => {
              const typeConf = TYPE_CONFIG[report.type];
              const TypeIcon = typeConf.icon;
              const FormatIcon = FORMAT_ICONS[report.format];
              return (
                <div key={report.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-xl shrink-0', typeConf.color)}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{report.title}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{report.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {report.status === 'GENERATING' ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                              <Loader2Icon className="h-3 w-3 animate-spin" /> Génération...
                            </span>
                          ) : report.status === 'FAILED' ? (
                            <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">Échec</span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Prêt</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{report.period}</span>
                        <span className="flex items-center gap-1"><FormatIcon className="h-3 w-3" />{report.format}</span>
                        {report.size && report.status === 'COMPLETED' && <span>{report.size}</span>}
                        <span>{report.author}</span>
                        <span>{new Date(report.generatedAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {report.status === 'COMPLETED' && (
                          <>
                            <Button variant="secondary" size="xs"><Eye className="h-3.5 w-3.5 mr-1" />Visualiser</Button>
                            <Button variant="secondary" size="xs"><Download className="h-3.5 w-3.5 mr-1" />Télécharger</Button>
                            <Button variant="ghost" size="xs"><Mail className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="xs"><Printer className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                        {report.status === 'GENERATING' && (
                          <span className="text-xs text-amber-600">En cours de génération...</span>
                        )}
                        {report.status === 'FAILED' && (
                          <Button variant="ghost" size="xs" className="text-red-500">Réessayer</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun rapport trouvé</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{search ? 'Essayez une autre recherche' : 'Générez votre premier rapport'}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function Loader2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
    </svg>
  );
}
