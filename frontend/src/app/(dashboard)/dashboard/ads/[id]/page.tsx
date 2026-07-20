'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Megaphone,
  BarChart3,
  Eye,
  MousePointerClick,
  Target,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import {
  useAdCampaign,
  useAdCampaignStats,
  usePauseAdCampaign,
  useResumeAdCampaign,
} from '@/features/adsHooks';
import { AD_STATUS_LABELS, AD_STATUS_STYLES } from '@/types/ads';

export default function AdDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: campaign, isLoading, error, refetch } = useAdCampaign(id);
  const { data: stats } = useAdCampaignStats(id);
  const pauseCampaign = usePauseAdCampaign();
  const resumeCampaign = useResumeAdCampaign();

  if (error) return <ErrorState message={(error as any).message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/ads"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{campaign?.name || 'Campagne'}</h1>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              AD_STATUS_STYLES[campaign?.status as keyof typeof AD_STATUS_STYLES] || ''
            )}
          >
            {AD_STATUS_LABELS[campaign?.status as keyof typeof AD_STATUS_LABELS] ||
              campaign?.status}
          </span>
        </div>
        <div className="flex gap-2">
          {campaign?.status === 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={() => pauseCampaign.mutate(id)}>
              Mettre en pause
            </Button>
          )}
          {campaign?.status === 'PAUSED' && (
            <Button variant="secondary" size="sm" onClick={() => resumeCampaign.mutate(id)}>
              Reprendre
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Impressions',
            value: stats?.impressions ?? campaign?._count?.impressions ?? 0,
            icon: Eye,
            color: 'text-blue-600',
          },
          {
            label: 'Clics',
            value: stats?.clicks ?? campaign?._count?.clicks ?? 0,
            icon: MousePointerClick,
            color: 'text-emerald-600',
          },
          {
            label: 'Conversions',
            value: stats?.conversions ?? campaign?._count?.conversions ?? 0,
            icon: Target,
            color: 'text-purple-600',
          },
          {
            label: 'CTR',
            value: stats?.ctr ? `${stats.ctr}%` : '0%',
            icon: BarChart3,
            color: 'text-amber-600',
          },
        ].map((s, i) => (
          <Card key={i} className="text-center py-4">
            <s.icon className={cn('h-5 w-5 mx-auto mb-1', s.color)} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Détails" titleIcon={<Megaphone className="h-4 w-4" />}>
          <div className="space-y-3">
            {[
              { label: 'Objectif', value: campaign?.objective },
              {
                label: 'Budget',
                value: campaign?.budget ? `${campaign.budget.toLocaleString()} FCFA` : '-',
              },
              {
                label: 'Début',
                value: campaign?.startDate
                  ? new Date(campaign.startDate).toLocaleDateString()
                  : '-',
              },
              {
                label: 'Fin',
                value: campaign?.endDate ? new Date(campaign.endDate).toLocaleDateString() : '-',
              },
              { label: 'Ciblage', value: campaign?.geoTarget || 'Tous' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium">{item.value || '-'}</span>
              </div>
            ))}
          </div>
        </Card>

        {stats && (
          <Card title="Performances" titleIcon={<BarChart3 className="h-4 w-4" />}>
            <div className="space-y-3">
              {[
                {
                  label: 'Dépenses totales',
                  value: stats.totalSpend ? `${stats.totalSpend.toLocaleString()} FCFA` : '0 FCFA',
                  icon: DollarSign,
                },
                {
                  label: 'Taux de clics (CTR)',
                  value: `${stats.ctr || 0}%`,
                  icon: MousePointerClick,
                },
                {
                  label: 'Taux de conversion',
                  value: `${stats.conversionRate || 0}%`,
                  icon: Target,
                },
                {
                  label: 'Coût par clic',
                  value:
                    stats.clicks > 0 ? `${Math.round(stats.totalSpend / stats.clicks)} FCFA` : '-',
                  icon: DollarSign,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <item.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
