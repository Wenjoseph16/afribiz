'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Plus, ChevronRight, Eye, CheckCircle2, XCircle, Loader, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useQuotes } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; color: string }> = {
  DRAFT: { label: 'Brouillon', variant: 'default', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  SENT: { label: 'Envoyé', variant: 'info', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  VIEWED: { label: 'Consulté', variant: 'info', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ACCEPTED: { label: 'Accepté', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REJECTED: { label: 'Refusé', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  EXPIRED: { label: 'Expiré', variant: 'warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONVERTED: { label: 'Converti', variant: 'success', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
};

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'DEMANDE', label: 'Demandes' },
  { key: 'DRAFT', label: 'Brouillons' },
  { key: 'SENT', label: 'Envoyés' },
  { key: 'ACCEPTED', label: 'Acceptés' },
  { key: 'CONVERTED', label: 'Convertir' },
  { key: 'REJECTED', label: 'Refusés' },
];

export default function QuotesPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { data: quotesData, isLoading, error, refetch } = useQuotes({ limit: 100 });

  const allQuotes = Array.isArray(quotesData) ? quotesData : (quotesData?.quotes || quotesData?.data || []);

  const filtered = allQuotes.filter((q: any) => {
    if (filter === 'DEMANDE') {
      return (q.notes || '').includes('[DEMANDE CLIENT]');
    }
    if (filter !== 'all' && q.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (q.quoteNumber || '').toLowerCase().includes(s) || (q.clientName || '').toLowerCase().includes(s) || (q.clientPhone || '').toLowerCase().includes(s);
    }
    return true;
  });

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/finance" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronRight className="w-4 h-4 text-gray-400 rotate-180" /></Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devis</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Créez et gérez vos devis clients</p>
        </div>
        <Link href="/dashboard/finance/quotes/new"><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouveau devis</Button></Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === t.key ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par n° devis, client..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12"><FileText className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500 mb-4">Aucun devis trouvé</p><Link href="/dashboard/finance/quotes/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouveau devis</Button></Link></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((q: any) => {
            const s = STATUS_CONFIG[q.status] || STATUS_CONFIG.DRAFT;
            const isExpired = q.validUntil && new Date(q.validUntil) < new Date() && !['ACCEPTED', 'REJECTED', 'CONVERTED', 'EXPIRED'].includes(q.status);
            return (
              <Link key={q.id} href={`/dashboard/finance/quotes/${q.id}`} className="block">
                <Card className={cn('p-4 hover:shadow-md transition-all group cursor-pointer', isExpired && 'ring-1 ring-amber-200 dark:ring-amber-800')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{q.quoteNumber || `#${q.id.slice(0, 8)}`}</h3>
                        <Badge variant={isExpired ? 'warning' : s.variant} size="xs">{isExpired ? 'Expiré' : s.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{q.clientName || 'Client'}</span>
                        {q.quoteItems?.length > 0 && <span>• {q.quoteItems.length} article{q.quoteItems.length > 1 ? 's' : ''}</span>}
                      </div>
                      {isExpired && <p className="text-[10px] text-amber-600 mt-1">Expiré le {new Date(q.validUntil).toLocaleDateString('fr-FR')}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(Number(q.totalAmount || 0))}</p>
                      <p className="text-[10px] text-gray-400">{new Date(q.createdAt || q.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0 mt-2" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
