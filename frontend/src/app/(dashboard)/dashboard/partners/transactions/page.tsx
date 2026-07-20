'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePartnerTransactions } from '@/features/partnerHooks';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  ArrowUpDown,
  Plus,
  Search,
  Calendar,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  PAYMENT: {
    label: 'Paiement',
    icon: ArrowUp,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  },
  WITHDRAWAL: {
    label: 'Retrait',
    icon: ArrowDown,
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  },
  COMMISSION: {
    label: 'Commission',
    icon: ArrowUp,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  },
  REFUND: {
    label: 'Remboursement',
    icon: ArrowDown,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  },
};

export default function PartnerTransactionsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch } = usePartnerTransactions();

  const list = Array.isArray(data) ? data : [];
  const filtered = list.filter(
    (t: any) =>
      !search ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.partner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Transactions partenaires"
        description="Suivez les transactions financières avec vos partenaires"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Partenaires', href: '/dashboard/partners' },
          { label: 'Transactions' },
        ]}
        actions={
          <Link href="/dashboard/partners/transactions/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle transaction
            </Button>
          </Link>
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une transaction..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <ArrowUpDown className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Aucune transaction
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Enregistrez votre première transaction partenaire
          </p>
          <Link href="/dashboard/partners/transactions/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle transaction
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx: any) => {
            const info = TYPE_MAP[tx.type] || {
              label: tx.type,
              icon: ArrowUpDown,
              color: 'text-gray-600 bg-gray-50 dark:bg-gray-800',
            };
            const Icon = info.icon;
            return (
              <Card
                key={tx.id}
                className="p-4 hover:border-brand/20 dark:hover:border-brand/30 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={cn('p-2.5 rounded-xl shrink-0', info.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {tx.description || info.label}
                        </p>
                        {tx.partner?.name && (
                          <p className="text-xs text-gray-500 mt-0.5">{tx.partner.name}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p
                          className={cn(
                            'font-semibold tabular-nums',
                            tx.type === 'PAYMENT' || tx.type === 'COMMISSION'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {tx.type === 'PAYMENT' || tx.type === 'COMMISSION' ? '+' : '-'}
                          {Number(tx.amount || 0).toLocaleString()} FCFA
                        </p>
                        <span className="text-xs text-gray-400 inline-flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>
                    {tx.reference && (
                      <p className="text-xs text-gray-400 mt-1">Réf: {tx.reference}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
