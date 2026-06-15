'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  FileText, Download, Users, Building2, Code2,
  TrendingUp, Megaphone, Store, Database,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';

type ReportTab =
  | 'financial' | 'activity' | 'growth' | 'users'
  | 'business' | 'developers' | 'advertising' | 'marketplace' | 'datahub';

export default function AdminFinancialReportsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isAdmin = user?.roles?.includes('ADMIN');

  const { data: report, isLoading } = useQuery({
    queryKey: ['admin', 'reports', activeTab, dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/reports/${activeTab}`, {
        params: { from: dateFrom || undefined, to: dateTo || undefined },
      });
      return res.data.data;
    },
  });

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'financial', label: 'Rapport financier', icon: FileText },
    { id: 'activity', label: 'Rapport activité', icon: TrendingUp },
    { id: 'growth', label: 'Rapport croissance', icon: TrendingUp },
    { id: 'users', label: 'Rapport utilisateurs', icon: Users },
    { id: 'business', label: 'Rapport business', icon: Building2 },
    { id: 'developers', label: 'Rapport développeurs', icon: Code2 },
    { id: 'advertising', label: 'Rapport publicitaire', icon: Megaphone },
    { id: 'marketplace', label: 'Rapport marketplace', icon: Store },
    { id: 'datahub', label: 'Rapport Data Hub', icon: Database },
  ];

  const handleExport = () => {
    alert('Exportation en cours... (fonctionnalité à venir)');
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Rapports financiers
        </h1>
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  const r = report || {};

  const renderReportContent = () => {
    switch (activeTab) {
      case 'financial':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Revenus
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {r.revenue?.total ? `${Number(r.revenue.total).toLocaleString()} FCFA` : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Revenu total</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {r.revenue?.subscriptions ? `${Number(r.revenue.subscriptions).toLocaleString()} FCFA` : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Abonnements</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {r.revenue?.ads ? `${Number(r.revenue.ads).toLocaleString()} FCFA` : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Publicités</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {r.revenue?.marketplace ? `${Number(r.revenue.marketplace).toLocaleString()} FCFA` : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Marketplace</p>
                </div>
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Transactions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.transactions?.volume ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Volume transactions</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {r.transactions?.fees ? `${Number(r.transactions.fees).toLocaleString()} FCFA` : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Frais collectés</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.transactions?.count ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Nombre de transactions</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.paymentMethods ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Par méthode de paiement</p>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'activity':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.activity?.activeUsers ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Utilisateurs actifs</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.activity?.sessions ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Sessions</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.activity?.pageViews ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Pages vues</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.activity?.apiCalls ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Appels API</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.activity?.AvgSessionDuration ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Durée moyenne session</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.activity?.bounceRate ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Taux de rebond</p>
            </Card>
          </div>
        );
      case 'growth':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Croissance utilisateurs
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.growth?.users?.daily ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Quotidienne</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.growth?.users?.weekly ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Hebdomadaire</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.growth?.users?.monthly ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Mensuelle</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.growth?.users?.yearly ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Annuelle</p>
                </div>
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Croissance business
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.growth?.business?.daily ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Quotidienne</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.growth?.business?.weekly ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Hebdomadaire</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.growth?.business?.monthly ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Mensuelle</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.growth?.business?.yearly ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Annuelle</p>
                </div>
              </div>
            </Card>
          </div>
        );
      case 'users':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.users?.total ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Total utilisateurs</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.users?.business ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Comptes business</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.users?.developer ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Développeurs</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.users?.verified ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Vérifiés</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.users?.byCountry ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Par pays</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.users?.byRole ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Par rôle</p>
            </Card>
          </div>
        );
      case 'business':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.business?.total ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Total business</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.business?.byType ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Par type</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.business?.byCountry ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Par pays</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.business?.bySector ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Par secteur</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.business?.active ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Actifs</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.business?.premium ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Premium</p>
            </Card>
          </div>
        );
      case 'developers':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.developers?.total ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Total développeurs</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.developers?.verified ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Vérifiés</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.developers?.pending ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">En attente</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.developers?.modules ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Modules publiés</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.developers?.installations ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Installations</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {r.developers?.revenue ? `${Number(r.developers.revenue).toLocaleString()} FCFA` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenus développeurs</p>
            </Card>
          </div>
        );
      case 'advertising':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.ads?.campaigns ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Campagnes</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.ads?.impressions?.toLocaleString() ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Impressions</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.ads?.clicks?.toLocaleString() ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Clics</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {r.ads?.ctr ? `${r.ads.ctr}%` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">CTR</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.ads?.conversions ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Conversions</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {r.ads?.revenue ? `${Number(r.ads.revenue).toLocaleString()} FCFA` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenus publicitaires</p>
            </Card>
          </div>
        );
      case 'marketplace':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.marketplace?.products ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Produits</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.marketplace?.services ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Services</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.marketplace?.orders ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Commandes</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.marketplace?.bookings ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Réservations</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {r.marketplace?.volume ? `${Number(r.marketplace.volume).toLocaleString()} FCFA` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Volume transactions</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {r.marketplace?.revenue ? `${Number(r.marketplace.revenue).toLocaleString()} FCFA` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenus marketplace</p>
            </Card>
          </div>
        );
      case 'datahub':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.datahub?.partners ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Partenaires</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.datahub?.reports ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Rapports générés</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.datahub?.accessLogs ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Logs d&apos;accès</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.datahub?.activeConsents ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Consentements actifs</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {r.datahub?.revenue ? `${Number(r.datahub.revenue).toLocaleString()} FCFA` : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Revenus Data Hub</p>
            </Card>
            <Card>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{r.datahub?.apiCalls ?? '-'}</p>
              <p className="text-xs text-gray-500 mt-1">Appels API</p>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Rapports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rapports détaillés de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
            />
          </div>
          <div className="pt-5">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <Loader className="py-12" />
      ) : (
        renderReportContent()
      )}
    </div>
  );
}
