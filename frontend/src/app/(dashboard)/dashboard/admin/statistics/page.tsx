'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  BarChart3, Users, Building2, Code2, Puzzle,
  Megaphone, CreditCard, Shield, Store, Database, TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';

export default function AdminStatisticsPage() {
  const { user } = useAuthStore();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isAdmin = user?.roles?.includes('ADMIN');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'statistics', dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.get('/admin/statistics', {
        params: { from: dateFrom || undefined, to: dateTo || undefined },
      });
      return res.data.data;
    },
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Statistiques avancées
        </h1>
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  const s = stats || {};

  const sections = [
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: Users,
      color: 'text-brand',
      bg: 'bg-brand-50 dark:bg-brand-900/30',
      items: [
        { label: 'Total', value: s.users?.total ?? '-' },
        { label: 'Nouveaux (aujourd\'hui)', value: s.users?.newToday ?? '-' },
        { label: 'Nouveaux (cette semaine)', value: s.users?.newWeek ?? '-' },
        { label: 'Nouveaux (ce mois)', value: s.users?.newMonth ?? '-' },
        { label: 'Actifs', value: s.users?.active ?? '-' },
        { label: 'Par rôle', value: s.users?.byRole ?? '-' },
      ],
    },
    {
      id: 'business',
      label: 'Business',
      icon: Building2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      items: [
        { label: 'Total', value: s.business?.total ?? '-' },
        { label: 'Nouveaux', value: s.business?.new ?? '-' },
        { label: 'Par type', value: s.business?.byType ?? '-' },
        { label: 'Par pays', value: s.business?.byCountry ?? '-' },
      ],
    },
    {
      id: 'developers',
      label: 'Développeurs',
      icon: Code2,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-900/30',
      items: [
        { label: 'Total', value: s.developers?.total ?? '-' },
        { label: 'Nouveaux', value: s.developers?.new ?? '-' },
        { label: 'Vérifiés', value: s.developers?.verified ?? '-' },
        { label: 'En attente', value: s.developers?.pending ?? '-' },
      ],
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: Puzzle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      items: [
        { label: 'Total', value: s.modules?.total ?? '-' },
        { label: 'Publiés', value: s.modules?.published ?? '-' },
        { label: 'En attente', value: s.modules?.pending ?? '-' },
        { label: 'Par catégorie', value: s.modules?.byCategory ?? '-' },
      ],
    },
    {
      id: 'ads',
      label: 'Publicités',
      icon: Megaphone,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      items: [
        { label: 'Campagnes', value: s.ads?.campaigns ?? '-' },
        { label: 'Impressions', value: s.ads?.impressions?.toLocaleString() ?? '-' },
        { label: 'Clics', value: s.ads?.clicks?.toLocaleString() ?? '-' },
        { label: 'Conversions', value: s.ads?.conversions ?? '-' },
        { label: 'Revenus', value: s.ads?.revenue ? `${Number(s.ads.revenue).toLocaleString()} FCFA` : '-' },
      ],
    },
    {
      id: 'payments',
      label: 'Paiements',
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      items: [
        { label: 'Volume', value: s.payments?.volume ? `${Number(s.payments.volume).toLocaleString()} FCFA` : '-' },
        { label: 'Taux de succès', value: s.payments?.successRate ? `${s.payments.successRate}%` : '-' },
        { label: 'Montant moyen', value: s.payments?.avgAmount ? `${Number(s.payments.avgAmount).toLocaleString()} FCFA` : '-' },
        { label: 'Par méthode', value: s.payments?.byMethod ?? '-' },
      ],
    },
    {
      id: 'escrow',
      label: 'Escrow',
      icon: Shield,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-900/30',
      items: [
        { label: 'Actifs', value: s.escrow?.active ?? '-' },
        { label: 'Terminés', value: s.escrow?.completed ?? '-' },
        { label: 'Litiges', value: s.escrow?.disputed ?? '-' },
      ],
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      icon: Store,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      items: [
        { label: 'Produits', value: s.marketplace?.products ?? '-' },
        { label: 'Services', value: s.marketplace?.services ?? '-' },
        { label: 'Réservations', value: s.marketplace?.bookings ?? '-' },
        { label: 'Commandes', value: s.marketplace?.orders ?? '-' },
      ],
    },
    {
      id: 'datahub',
      label: 'Data Hub',
      icon: Database,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      items: [
        { label: 'Partenaires', value: s.datahub?.partners ?? '-' },
        { label: 'Rapports', value: s.datahub?.reports ?? '-' },
        { label: 'Logs d\'accès', value: s.datahub?.accessLogs ?? '-' },
        { label: 'Revenus', value: s.datahub?.revenue ? `${Number(s.datahub.revenue).toLocaleString()} FCFA` : '-' },
      ],
    },
    {
      id: 'growth',
      label: 'Croissance',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      items: [
        { label: 'Quotidienne', value: s.growth?.daily ?? '-' },
        { label: 'Hebdomadaire', value: s.growth?.weekly ?? '-' },
        { label: 'Mensuelle', value: s.growth?.monthly ?? '-' },
        { label: 'Annuelle', value: s.growth?.yearly ?? '-' },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Statistiques avancées
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vue d&apos;ensemble des indicateurs clés de la plateforme
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
        </div>
      </div>

      {isLoading ? (
        <Loader className="py-12" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${section.bg} ${section.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    {section.label}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {section.items.map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
