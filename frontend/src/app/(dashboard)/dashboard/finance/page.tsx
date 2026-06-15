'use client';

import Link from 'next/link';
import { FileText, DollarSign, TrendingUp, Clock, AlertTriangle, ChevronRight, FileSignature, Loader } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useFinanceStats, useQuotes, useInvoices } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

export default function FinancePage() {
  const { data: statsData, isLoading } = useFinanceStats();
  const { data: quotesData } = useQuotes({ limit: 5 });
  const { data: invoicesData } = useInvoices({ limit: 5 });

  const stats = statsData?.data || statsData || { totalRevenue: 0, paidRevenue: 0, unpaidCount: 0, overdueCount: 0, activeQuotes: 0 };
  const recentQuotes = Array.isArray(quotesData) ? quotesData : (quotesData?.quotes || quotesData?.data || []);
  const recentInvoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.invoices || invoicesData?.data || []);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Finance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos devis, factures et suivi financier</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Revenu total</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(Number(stats.totalRevenue || 0))}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Payé</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(Number(stats.paidRevenue || 0))}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Impayées</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.unpaidCount || 0}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', Number(stats.overdueCount) > 0 ? 'bg-red-100' : 'bg-gray-100')}>
              <AlertTriangle className={cn('w-4 h-4', Number(stats.overdueCount) > 0 ? 'text-red-600' : 'text-gray-400')} />
            </div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">En retard</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.overdueCount || 0}</p></div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/dashboard/finance/quotes/new">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand/10"><FileText className="w-6 h-6 text-brand" /></div>
              <div className="flex-1"><p className="font-semibold text-gray-900 dark:text-white">Nouveau devis</p><p className="text-xs text-gray-500">Créer un devis pour un client</p></div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/finance/invoices/new">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100"><FileSignature className="w-6 h-6 text-emerald-600" /></div>
              <div className="flex-1"><p className="font-semibold text-gray-900 dark:text-white">Nouvelle facture</p><p className="text-xs text-gray-500">Créer une facture manuelle</p></div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/finance/debts">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-100"><DollarSign className="w-6 h-6 text-red-600" /></div>
              <div className="flex-1"><p className="font-semibold text-gray-900 dark:text-white">Dettes & Paiements</p><p className="text-xs text-gray-500">Gérer les dettes, escrow, risques clients</p></div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-brand" />Derniers devis</h3>
            <Link href="/dashboard/finance/quotes" className="text-xs text-brand hover:underline">Voir tout</Link>
          </div>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun devis récent</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recentQuotes.slice(0, 5).map((q: any) => (
                <Link key={q.id} href={`/dashboard/finance/quotes/${q.id}`} className="flex items-center justify-between py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{q.quoteNumber || 'Devis'}</p>
                    <p className="text-[10px] text-gray-400">{q.clientName || q.client?.firstName + ' ' + q.client?.lastName || 'Client'}</p>
                  </div>
                  <div className="text-right"><p className="text-xs font-semibold text-gray-900 dark:text-white">{formatPrice(Number(q.totalAmount || 0))}</p><p className="text-[9px] text-gray-400">{q.status}</p></div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2"><FileSignature className="w-4 h-4 text-emerald-600" />Dernières factures</h3>
            <Link href="/dashboard/finance/invoices" className="text-xs text-brand hover:underline">Voir tout</Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune facture récente</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recentInvoices.slice(0, 5).map((inv: any) => (
                <Link key={inv.id} href={`/dashboard/finance/invoices/${inv.id}`} className="flex items-center justify-between py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{inv.invoiceNumber || 'Facture'}</p>
                    <p className="text-[10px] text-gray-400">{inv.clientName || 'Client'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatPrice(Number(inv.totalAmount || 0))}</p>
                    <p className={cn('text-[9px]', inv.status === 'PAID' ? 'text-emerald-600' : inv.status === 'OVERDUE' ? 'text-red-500' : 'text-amber-500')}>{inv.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
