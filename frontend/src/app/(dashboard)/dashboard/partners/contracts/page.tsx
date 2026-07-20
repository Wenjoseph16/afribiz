'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePartnerContracts } from '@/features/partnerHooks';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { FileText, Plus, Search, Eye, Pencil, FileSignature, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: {
    label: 'Brouillon',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  },
  PENDING: {
    label: 'En attente',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  ACTIVE: {
    label: 'Actif',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  COMPLETED: {
    label: 'Terminé',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export default function PartnerContractsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error, refetch } = usePartnerContracts();

  const list = Array.isArray(data) ? data : [];
  const filtered = list.filter(
    (c: any) =>
      !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.partner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Contrats partenaires"
        description="Gérez les contrats avec vos partenaires"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Partenaires', href: '/dashboard/partners' },
          { label: 'Contrats' },
        ]}
        actions={
          <Link href="/dashboard/partners/contracts/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouveau contrat
            </Button>
          </Link>
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un contrat..."
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
          <FileText className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Aucun contrat
          </h3>
          <p className="text-sm text-gray-500 mb-4">Créez votre premier contrat partenaire</p>
          <Link href="/dashboard/partners/contracts/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Nouveau contrat
            </Button>
          </Link>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contrat</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Partenaire</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((contract: any) => {
                const st = STATUS_MAP[contract.status] || { label: contract.status, color: '' };
                return (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/partners/contracts/${contract.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {contract.title}
                          </p>
                          {contract.amount && (
                            <p className="text-xs text-gray-500">
                              {Number(contract.amount).toLocaleString()} FCFA
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {contract.partner?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn('text-xs font-medium', st.color)}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {contract.createdAt
                          ? new Date(contract.createdAt).toLocaleDateString()
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/dashboard/partners/contracts/${contract.id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {!contract.signedByBusiness && (
                          <Link
                            href={`/dashboard/partners/contracts/${contract.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
