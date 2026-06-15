'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  Megaphone, Eye, MousePointerClick, DollarSign, Calendar, Clock,
  CheckCircle2, XCircle, PauseCircle, Search, Filter,
  TrendingUp, Users, Wallet, BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
  ACTIVE: 'success', PENDING: 'warning', REJECTED: 'danger',
  COMPLETED: 'default', SUSPENDED: 'danger', PAUSED: 'info', SCHEDULED: 'info',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active', PENDING: 'En attente', REJECTED: 'Refusée',
  COMPLETED: 'Terminée', SUSPENDED: 'Suspendue', PAUSED: 'En pause', SCHEDULED: 'Programmée',
};

export default function AdminAdsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: campaignsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-ads', 'campaigns', { search, status: statusFilter }],
    queryFn: async () => {
      const res = await apiClient.adminGetAllAdCampaigns({ search, status: statusFilter || undefined });
      return res.data.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-ads', 'stats'],
    queryFn: async () => {
      const res = await apiClient.adminGetAdStats();
      return res.data.data;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-ads', 'revenue'],
    queryFn: async () => {
      const res = await apiClient.adminGetAdRevenue();
      return res.data.data;
    },
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminValidateAdCampaign(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-ads'] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.adminRejectAdCampaign(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-ads'] }); },
  });

  const campaigns = Array.isArray(campaignsData?.data || campaignsData) ? (campaignsData?.data || campaignsData) : [];
  const total = campaignsData?.total || campaigns.length;
  const pendingCount = campaigns.filter((c: any) => c.status === 'PENDING').length;

  const statsCards = [
    { label: 'Total campagnes', value: total, icon: Megaphone, color: 'text-brand' },
    { label: 'En attente', value: pendingCount, icon: Clock, color: 'text-amber-600' },
    { label: 'Actives', value: campaigns.filter((c: any) => c.status === 'ACTIVE').length, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Suspendues', value: campaigns.filter((c: any) => c.status === 'SUSPENDED').length, icon: PauseCircle, color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Publicités - Administration"
        description="Gérez toutes les campagnes publicitaires de la plateforme"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/admin' }, { label: 'Publicités' }]}
        actions={
          <Link href="/dashboard/admin/ads/packages">
            <Button variant="secondary" size="sm">
              <DollarSign className="h-4 w-4 mr-1.5" />
              Packages
            </Button>
          </Link>
        }
      />

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label} padding="sm" hoverable>
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue stats */}
      {revenueData && (
        <Card padding="sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Revenus totaux</p>
              <p className="text-lg font-bold text-emerald-600">{(revenueData.totalRevenue || 0).toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Revenus mensuels</p>
              <p className="text-lg font-bold text-blue-600">{(revenueData.monthlyRevenue || 0).toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Factures en attente</p>
              <p className="text-lg font-bold text-amber-600">{(revenueData.pendingInvoices || 0).toLocaleString()} FCFA ({revenueData.pendingInvoiceCount || 0})</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dépenses publicitaires</p>
              <p className="text-lg font-bold text-purple-600">{(revenueData.totalAdSpend || 0).toLocaleString()} FCFA</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher une campagne..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">En pause</option>
            <option value="SCHEDULED">Programmée</option>
            <option value="COMPLETED">Terminée</option>
            <option value="REJECTED">Refusée</option>
            <option value="SUSPENDED">Suspendue</option>
          </select>
        </div>
      </Card>

      {/* Campaigns list */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : campaigns.length === 0 ? (
          <EmptyState icon={<Megaphone className="h-8 w-8" />} title="Aucune campagne" description="Il n'y a pas encore de campagnes publicitaires sur la plateforme." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-4 font-medium">Campagne</th>
                  <th className="p-4 font-medium">Annonceur</th>
                  <th className="p-4 font-medium">Budget</th>
                  <th className="p-4 font-medium">Période</th>
                  <th className="p-4 font-medium">Perf.</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign: any) => (
                  <tr key={campaign.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{campaign.name}</p>
                      <p className="text-[11px] text-gray-400">{campaign.objective?.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{campaign.business?.name || campaign.companyName || 'N/A'}</p>
                      <p className="text-[11px] text-gray-400">{campaign.advertiserType}</p>
                    </td>
                    <td className="p-4 font-semibold">{(Number(campaign.budget) || 0).toLocaleString()} FCFA</td>
                    <td className="p-4 text-xs text-gray-500">
                      {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('fr-FR') : '-'} → {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs">
                        <Eye className="h-3 w-3 text-gray-400" />{campaign._count?.impressions ?? 0}
                        <MousePointerClick className="h-3 w-3 text-gray-400 ml-1" />{campaign._count?.clicks ?? 0}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_BADGE[campaign.status] || 'default'} size="xs">
                        {STATUS_LABELS[campaign.status] || campaign.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {campaign.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="xs" onClick={() => validateMutation.mutate(campaign.id)}
                              className="text-emerald-600 hover:bg-emerald-50" title="Valider">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => {
                              const reason = prompt('Motif de rejet :');
                              if (reason) rejectMutation.mutate({ id: campaign.id, reason });
                            }} className="text-red-600 hover:bg-red-50" title="Rejeter">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Link href={`/dashboard/ads/${campaign.id}`}>
                          <Button variant="ghost" size="xs"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                      </div>
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
