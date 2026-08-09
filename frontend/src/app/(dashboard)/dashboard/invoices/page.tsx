'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  FileSpreadsheet,
  Eye,
  Clock,
  AlertCircle,
  Building2,
  ArrowUpRight,
  Download,
  Plus,
  Search,
  User,
  Calendar,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useInvoices, useQuotes, useFinanceStats } from '@/features/hooks/finance';
import { formatCurrency } from '@/lib/currency';

type Tab = 'invoices' | 'quotes';

const INVOICE_STATUS: Record<
  string,
  { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' | 'brand'; pulse?: boolean }
> = {
  PAID: { label: 'Payée', tone: 'success' },
  PARTIALLY_PAID: { label: 'Partielle', tone: 'brand' },
  SENT: { label: 'Envoyée', tone: 'warning' },
  DRAFT: { label: 'Brouillon', tone: 'muted' },
  OVERDUE: { label: 'En retard', tone: 'danger', pulse: true },
  CANCELLED: { label: 'Annulée', tone: 'muted' },
};

const QUOTE_STATUS: Record<
  string,
  { label: string; tone: 'success' | 'warning' | 'danger' | 'muted' | 'brand'; pulse?: boolean }
> = {
  DRAFT: { label: 'Brouillon', tone: 'muted' },
  SENT: { label: 'Envoyé', tone: 'warning', pulse: true },
  ACCEPTED: { label: 'Accepté', tone: 'success' },
  REJECTED: { label: 'Refusé', tone: 'danger' },
  EXPIRED: { label: 'Expiré', tone: 'muted' },
  CONVERTED: { label: 'Converti', tone: 'brand' },
};

function safeDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function clientName(inv: any): string {
  if (inv?.client?.firstName || inv?.client?.lastName) {
    return `${inv.client.firstName ?? ''} ${inv.client.lastName ?? ''}`.trim();
  }
  return inv?.clientName || inv?.clientEmail || 'Client';
}

export default function BusinessFinancePage() {
  const [tab, setTab] = useState<Tab>('invoices');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: invoicesData, isLoading: loadingInvoices } = useInvoices({ limit: 100 });
  const { data: quotesData, isLoading: loadingQuotes } = useQuotes({ limit: 100 });
  const { data: stats } = useFinanceStats();

  const invoices = useMemo(() => {
    const list = invoicesData?.invoices ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (i: any) =>
        String(i.invoiceNumber || '').toLowerCase().includes(q) ||
        clientName(i).toLowerCase().includes(q)
    );
  }, [invoicesData, search]);

  const quotes = useMemo(() => {
    const list = quotesData?.quotes ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (i: any) =>
        String(i.quoteNumber || '').toLowerCase().includes(q) ||
        clientName(i).toLowerCase().includes(q)
    );
  }, [quotesData, search]);

  const selected =
    tab === 'invoices'
      ? invoices.find((i: any) => i.id === selectedId) ?? null
      : quotes.find((q: any) => q.id === selectedId) ?? null;

  // KPIs servis par le backend (getFinStats) : comptent TOUTES les factures,
  // pas seulement les 100 chargées dans la liste (évite les totaux tronqués).
  const totalRevenue = Number(stats?.paidRevenue ?? stats?.totalRevenue ?? 0);
  const pendingInvoices = stats?.unpaidCount ?? 0;
  const overdueCount = stats?.overdueCount ?? 0;
  const activeQuotes = stats?.activeQuotes ?? 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        title={tab === 'invoices' ? 'Centre de facturation' : 'Devis & propositions'}
        description="Pilotez vos factures, suivez les règlements et convertissez vos devis en chiffre d'affaires."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Finance' }, { label: 'Factures & Devis' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/invoices/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand/90 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nouvelle facture
            </Link>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Encaissé (payées)"
          value={formatCurrency(totalRevenue)}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          label="En attente de paiement"
          value={pendingInvoices}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="En retard"
          value={overdueCount}
          iconBg="bg-red-50 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
        />
        <StatsCard
          icon={<FileSpreadsheet className="h-5 w-5" />}
          label="Devis en attente"
          value={activeQuotes}
          iconBg="bg-brand-50 dark:bg-brand-900/20"
          iconColor="text-brand dark:text-brand-400"
        />
      </div>

      {/* Tabs + filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
          {(
            [
              { key: 'invoices', label: 'Factures', icon: Receipt },
              { key: 'quotes', label: 'Devis', icon: FileSpreadsheet },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setSelectedId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-white dark:bg-gray-700 text-brand shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    tab === t.key
                      ? 'bg-brand/10 text-brand'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  }`}
                >
                  {t.key === 'invoices' ? invoices.length : quotes.length}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Rechercher ${tab === 'invoices' ? 'une facture' : 'un devis'}…`}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <LiveBadge tone="brand" label="Temps réel" value="à jour" />
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {tab === 'invoices' && loadingInvoices && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-5 animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'quotes' && loadingQuotes && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-5 animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingInvoices && tab === 'invoices' && invoices.length === 0 && (
          <EmptyState
            title="Aucune facture émise"
            description="Créez votre première facture professionnelle : elle sera liée à vos commandes et suivie en temps réel."
            action={
              <Link
                href="/dashboard/invoices/new"
                className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer une facture
              </Link>
            }
          />
        )}

        {!loadingQuotes && tab === 'quotes' && quotes.length === 0 && (
          <EmptyState
            title="Aucun devis"
            description="Envoyez un devis professionnel à un client et convertissez-le en facture dès son acceptation."
            action={
              <Link
                href="/dashboard/finance/quotes/new"
                className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Créer un devis
              </Link>
            }
          />
        )}

        {tab === 'invoices' && !loadingInvoices && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3.5 font-semibold">Facture</th>
                  <th className="px-5 py-3.5 font-semibold">Client</th>
                  <th className="px-5 py-3.5 font-semibold">Émise le</th>
                  <th className="px-5 py-3.5 font-semibold">Échéance</th>
                  <th className="px-5 py-3.5 font-semibold">Statut</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Montant</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {invoices.map((inv: any) => {
                  const sc = INVOICE_STATUS[inv.status] || INVOICE_STATUS.DRAFT;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedId(inv.id)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand/5 dark:bg-brand/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-brand" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {inv.invoiceNumber || `FACT-${inv.id.slice(0, 8)}`}
                            </p>
                            {inv.quote?.quoteNumber && (
                              <p className="text-xs text-gray-400">
                                issu de {inv.quote.quoteNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {clientName(inv)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {safeDate(inv.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {safeDate(inv.dueDate)}
                      </td>
                      <td className="px-5 py-4">
                        <LiveBadge tone={sc.tone} label={sc.label} pulse={sc.pulse} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(Number(inv.totalAmount || 0))}
                        </p>
                        {inv.status === 'PARTIALLY_PAID' && (
                          <p className="text-xs text-amber-500">
                            payé {formatCurrency(Number(inv.amountPaid || 0))}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/dashboard/invoices/${inv.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                            title="Voir le détail"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          <a
                            href={`/api/business/finance/invoices/${inv.id}/pdf`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                            title="Télécharger PDF"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'quotes' && !loadingQuotes && quotes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3.5 font-semibold">Devis</th>
                  <th className="px-5 py-3.5 font-semibold">Client</th>
                  <th className="px-5 py-3.5 font-semibold">Émis le</th>
                  <th className="px-5 py-3.5 font-semibold">Validité</th>
                  <th className="px-5 py-3.5 font-semibold">Statut</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Montant</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {quotes.map((q: any) => {
                  const sc = QUOTE_STATUS[q.status] || QUOTE_STATUS.DRAFT;
                  return (
                    <tr
                      key={q.id}
                      onClick={() => setSelectedId(q.id)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand/5 dark:bg-brand/10 flex items-center justify-center">
                            <FileSpreadsheet className="h-4 w-4 text-brand" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {q.quoteNumber || `DEV-${q.id.slice(0, 8)}`}
                            </p>
                            {q.invoice?.invoiceNumber && (
                              <p className="text-xs text-gray-400">
                                converti en {q.invoice.invoiceNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {clientName(q)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {safeDate(q.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        {safeDate(q.validUntil || q.expiresAt)}
                      </td>
                      <td className="px-5 py-4">
                        <LiveBadge tone={sc.tone} label={sc.label} pulse={sc.pulse} />
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(Number(q.totalAmount || 0))}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/dashboard/finance/quotes/${q.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                            title="Voir le détail"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                          <a
                            href={`/api/business/finance/quotes/${q.id}/pdf`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                            title="Télécharger PDF"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer 360 */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelectedId(null)}
        icon={<FileText className="h-5 w-5 text-brand" />}
        title={selected?.invoiceNumber || selected?.quoteNumber || 'Détail'}
        subtitle={
          tab === 'invoices'
            ? 'Facture émise par votre entreprise'
            : 'Devis envoyé à votre client'
        }
        size="md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{clientName(selected)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {tab === 'invoices' ? 'Émise le' : 'Émis le'}
                </p>
                <p className="text-sm font-semibold mt-1">{safeDate(selected.createdAt)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {tab === 'invoices' ? 'Échéance' : 'Validité'}
                </p>
                <p className="text-sm font-semibold mt-1">
                  {safeDate(selected.dueDate || selected.validUntil || selected.expiresAt)}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(Number(selected.totalAmount || 0))}
              </span>
            </div>
            {tab === 'invoices' && selected.status === 'PARTIALLY_PAID' && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 flex items-center justify-between">
                <span className="text-sm text-amber-600 dark:text-amber-400">Reste à payer</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(
                    Number(selected.totalAmount || 0) - Number(selected.amountPaid || 0)
                  )}
                </span>
              </div>
            )}
            {tab === 'invoices' && selected.invoiceItems?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                  Articles ({selected.invoiceItems.length})
                </p>
                <div className="space-y-2">
                  {selected.invoiceItems.slice(0, 6).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2"
                    >
                      <span className="text-gray-600 dark:text-gray-300">{item.description || item.label || 'Article'}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(Number(item.amount || item.total || 0))}
                      </span>
                    </div>
                  ))}
                  {Number(selected.discountAmount || 0) > 0 && (
                    <div className="flex items-center justify-between text-sm pb-2">
                      <span className="text-gray-600 dark:text-gray-300">
                        Remise{selected.promoCode ? ` (${selected.promoCode})` : ''}
                      </span>
                      <span className="font-semibold text-red-500">
                        -{formatCurrency(Number(selected.discountAmount))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {tab === 'quotes' && selected.quoteItems?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                  Articles ({selected.quoteItems.length})
                </p>
                <div className="space-y-2">
                  {selected.quoteItems.slice(0, 6).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2"
                    >
                      <span className="text-gray-600 dark:text-gray-300">{item.description || item.label || 'Article'}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(Number(item.amount || item.total || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Link
                href={
                  tab === 'invoices'
                    ? `/dashboard/invoices/${selected.id}`
                    : `/dashboard/finance/quotes/${selected.id}`
                }
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand/90 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Voir le détail
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
