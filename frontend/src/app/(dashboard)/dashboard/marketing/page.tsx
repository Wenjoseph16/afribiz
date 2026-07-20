'use client';

import { useQuery } from '@tanstack/react-query';
import { Megaphone, Plus, BarChart3, Target, Users, Eye } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState } from 'react';
import Link from 'next/link';

export default function MarketingPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      try {
        const res = await apiClient.getPromoCampaigns();
        return res.data.data || { campaigns: [] };
      } catch {
        return { campaigns: [] };
      }
    },
    retry: false,
  });

  if (error) {
    const status = (error as any)?.response?.status || (error as any)?.status;
    if (status === 403 || status === 404) {
      return (
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            title="Marketing"
            description="Créez et gérez vos campagnes marketing"
            breadcrumbs={[{ label: 'Marketing' }]}
          />
          <div className="p-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
            <Megaphone className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Module Marketing non activé
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Pour utiliser les campagnes marketing, vous devez d'abord activer le module Promotions
              depuis votre espace configuration.
            </p>
          </div>
        </div>
      );
    }
    return (
      <ErrorState message={(error as any)?.message || 'Erreur de chargement'} onRetry={refetch} />
    );
  }
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const campaigns = Array.isArray(data) ? data : (data?.campaigns ?? []);
  const filtered = filter === 'all' ? campaigns : campaigns.filter((c: any) => c.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Marketing"
        description="Créez et gérez vos campagnes marketing"
        breadcrumbs={[{ label: 'Marketing' }]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle campagne
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<Megaphone className="h-5 w-5" />}
          label="Campagnes"
          value={campaigns.length}
        />
        <StatsCard
          icon={<Target className="h-5 w-5" />}
          label="Actives"
          value={campaigns.filter((c: any) => c.status === 'active').length}
        />
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          label="Planifiées"
          value={campaigns.filter((c: any) => c.status === 'scheduled').length}
        />
        <StatsCard
          icon={<Eye className="h-5 w-5" />}
          label="Taux succès"
          value={
            campaigns.length > 0
              ? `${Math.round((campaigns.filter((c: any) => c.status === 'completed').length / campaigns.length) * 100)}%`
              : '0%'
          }
        />
      </div>

      <Card title="Campagnes" titleIcon={<Megaphone className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'active', 'scheduled', 'completed', 'paused'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === s
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-10 w-10" />}
            title="Aucune campagne"
            description="Créez votre première campagne marketing"
            action={
              <Link href="/dashboard/marketing/new">
                <Button size="sm">Créer</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.channel} · {new Date(c.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{c.budget} CFA</span>
                  <Badge
                    variant={
                      c.status === 'active'
                        ? 'success'
                        : c.status === 'scheduled'
                          ? 'warning'
                          : c.status === 'paused'
                            ? 'default'
                            : 'info'
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
