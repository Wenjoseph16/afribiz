'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Search,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import {
  useMyAdCampaigns,
  usePauseAdCampaign,
  useResumeAdCampaign,
  useDeleteAdCampaign,
} from '@/features/adsHooks';
import { AD_STATUS_LABELS, AD_STATUS_STYLES } from '@/types/ads';

const statusTabs = ['all', 'ACTIVE', 'PENDING', 'SCHEDULED', 'PAUSED', 'COMPLETED', 'REJECTED'];

export default function AdsPage() {
  const { data, isLoading, error, refetch } = useMyAdCampaigns();
  const pauseCampaign = usePauseAdCampaign();
  const resumeCampaign = useResumeAdCampaign();
  const deleteCampaign = useDeleteAdCampaign();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteCampaignTarget, setDeleteCampaignTarget] = useState<string | null>(null);

  const campaigns = Array.isArray(data) ? data : (data?.campaigns ?? data?.data ?? []);

  const filtered = campaigns.filter((c: any) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
    pending: campaigns.filter((c: any) => c.status === 'PENDING').length,
    completed: campaigns.filter((c: any) => c.status === 'COMPLETED').length,
  };

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Publicités"
        description="Créez et gérez vos campagnes publicitaires"
        breadcrumbs={[{ label: 'Publicités' }]}
        actions={
          <Link href="/dashboard/ads/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle campagne
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Megaphone, color: 'text-brand' },
          { label: 'Actives', value: stats.active, icon: Play, color: 'text-emerald-600' },
          { label: 'En attente', value: stats.pending, icon: Filter, color: 'text-amber-600' },
          { label: 'Terminées', value: stats.completed, icon: BarChart3, color: 'text-blue-600' },
        ].map((s, i) => (
          <Card key={i} className="text-center py-4">
            <s.icon className={cn('h-5 w-5 mx-auto mb-1', s.color)} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {statusTabs.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
                  filter === s
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                )}
              >
                {s === 'all' ? 'Toutes' : AD_STATUS_LABELS[s as keyof typeof AD_STATUS_LABELS] || s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-10 w-10" />}
            title="Aucune campagne"
            description="Créez votre première campagne publicitaire"
            action={
              <Link href="/dashboard/ads/new">
                <Button size="sm">Créer</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                    <Megaphone className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/ads/${c.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-brand truncate block"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {c.objective ? `${c.objective} · ` : ''}
                      {c.startDate ? new Date(c.startDate).toLocaleDateString() : ''} -{' '}
                      {c.endDate ? new Date(c.endDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      AD_STATUS_STYLES[c.status as keyof typeof AD_STATUS_STYLES] || ''
                    )}
                  >
                    {AD_STATUS_LABELS[c.status as keyof typeof AD_STATUS_LABELS] || c.status}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.status === 'ACTIVE' && (
                      <button
                        onClick={() => pauseCampaign.mutate(c.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-amber-500"
                        title="Mettre en pause"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {c.status === 'PAUSED' && (
                      <button
                        onClick={() => resumeCampaign.mutate(c.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-emerald-500"
                        title="Reprendre"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Link
                      href={`/dashboard/ads/${c.id}`}
                      className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-brand"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    {(c.status === 'PENDING' ||
                      c.status === 'REJECTED' ||
                      c.status === 'PAUSED') && (
                      <button
                        onClick={() => setDeleteCampaignTarget(c.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmationModal
        open={!!deleteCampaignTarget}
        onClose={() => setDeleteCampaignTarget(null)}
        onConfirm={async () => {
          if (deleteCampaignTarget) {
            await deleteCampaign.mutateAsync(deleteCampaignTarget);
            setDeleteCampaignTarget(null);
          }
        }}
        title="Supprimer cette campagne ?"
        description="Cette action est irréversible. La campagne sera définitivement supprimée."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  );
}
