'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  ArrowUpRight,
  Download,
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { motion } from 'framer-motion';
import { useClientInvoices, useClientInvoiceStats } from '@/features/hooks/finance';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PAID: {
    label: 'Payée',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    icon: CheckCircle2,
  },
  PARTIALLY_PAID: {
    label: 'Partielle',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    icon: Clock,
  },
  SENT: { label: 'Envoyée', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', icon: Eye },
  DRAFT: { label: 'Brouillon', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800', icon: FileText },
  OVERDUE: {
    label: 'En retard',
    color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    icon: AlertCircle,
  },
  CANCELLED: {
    label: 'Annulée',
    color: 'text-gray-600 bg-gray-50 dark:bg-gray-800',
    icon: XCircle,
  },
};

function formatAmount(amount: number | string | undefined | null): string {
  if (!amount) return '0 FCFA';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
}

export default function ClientInvoicesPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const {
    data: invoicesData,
    isLoading,
    error,
  } = useClientInvoices({ status: statusFilter || undefined });
  const { data: statsData } = useClientInvoiceStats();

  const invoices = invoicesData?.invoices ?? [];
  const stats = statsData || {};

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-brand" />
            Mes Factures & Devis
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Consultez les factures et devis reçus des professionnels
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total dû',
            value: formatAmount(stats.totalAmount),
            icon: FileText,
            color: 'text-brand',
          },
          {
            label: 'Payées',
            value: stats.paidCount ?? 0,
            icon: CheckCircle2,
            color: 'text-emerald-500',
          },
          {
            label: 'En attente',
            value: stats.unpaidCount ?? 0,
            icon: Clock,
            color: 'text-amber-500',
          },
          {
            label: 'En retard',
            value: stats.overdueCount ?? 0,
            icon: AlertCircle,
            color: 'text-red-500',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-gray-400">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Building2 className="h-4 w-4" />
            <span>Factures reçues des professionnels</span>
          </div>
          <div className="sm:ml-auto">
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
      </motion.div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {isLoading ? (
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
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <FileText className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Impossible de charger vos factures
            </p>
            <p className="text-sm text-gray-400 mt-1">Vérifiez votre connexion et réessayez</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune facture reçue</p>
            <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              Vos factures et devis des professionnels apparaîtront ici lorsqu&apos;ils vous seront
              envoyés.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {invoices.map((invoice: any, idx: number) => {
              const StatusIcon = statusConfig[invoice.status]?.icon || Clock;
              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-brand/5 dark:bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {invoice.invoiceNumber || `FACT-${invoice.id.slice(0, 8)}`}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[invoice.status]?.color || ''}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[invoice.status]?.label || invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {invoice.business?.name || 'Professionnel'}
                        </span>
                        <span>•</span>
                        <span>{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:ml-auto">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatAmount(invoice.totalAmount)}
                      </p>
                      {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <p className="text-xs text-amber-500">
                          Restant : {formatAmount(invoice.totalAmount - (invoice.amountPaid || 0))}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                        title="Voir le détail"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/api/client/finance/invoices/${invoice.id}/pdf`}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                        title="Télécharger PDF"
                        target="_blank"
                      >
                        <Download className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
