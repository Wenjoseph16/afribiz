'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Send,
  TrendingUp,
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { useQuotes } from '@/features/hooks/finance';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Brouillon', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800', icon: FileText },
  SENT: { label: 'Envoyé', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: Send },
  ACCEPTED: {
    label: 'Accepté',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    icon: CheckCircle2,
  },
  REJECTED: { label: 'Refusé', color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: XCircle },
  EXPIRED: {
    label: 'Expiré',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    icon: Clock,
  },
  CONVERTED: {
    label: 'Converti',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    icon: TrendingUp,
  },
};

export default function QuotesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: quotes, isLoading } = useQuotes({ status: statusFilter || undefined });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre des devis"
        description="Créez, envoyez et suivez vos devis clients"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Devis' }]}
        actions={
          <>
            <LiveBadge label="Temps réel" />
            <Link
              href="/dashboard/quotes/new"
              className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Nouveau devis
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: quotes?.total || 0, icon: FileText, color: 'text-brand' },
          {
            label: 'Acceptés',
            value: quotes?.byStatus?.ACCEPTED || 0,
            icon: CheckCircle2,
            color: 'text-emerald-500',
          },
          {
            label: 'En attente',
            value: quotes?.byStatus?.SENT || 0,
            icon: Send,
            color: 'text-blue-500',
          },
          {
            label: 'Brouillons',
            value: quotes?.byStatus?.DRAFT || 0,
            icon: FileText,
            color: 'text-gray-500',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un devis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Tous les statuts' },
              ...Object.entries(statusConfig).map(([key, config]) => ({
                value: key,
                label: config.label,
              })),
            ]}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex items-center gap-4">
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : !quotes?.items || quotes.items.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun devis</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre premier devis</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {quotes.items.map((quote: any) => {
              const StatusIcon = statusConfig[quote.status]?.icon || FileText;
              return (
                <div
                  key={quote.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {quote.number || `DEV-${quote.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {quote.clientName || 'Client'} ·{' '}
                        {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[quote.status]?.color || ''}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig[quote.status]?.label || quote.status}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {quote.total ? `${(quote.total / 1000).toFixed(0)}k FCFA` : '-'}
                    </p>
                    <Link
                      href={`/dashboard/quotes/${quote.id}`}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
