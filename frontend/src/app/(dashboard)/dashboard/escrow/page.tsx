'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield, CheckCircle2, Clock, XCircle, AlertTriangle,
  Search, DollarSign, FileText, MessageCircle,
  RefreshCw, Eye, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useClientEscrows, useConfirmClientEscrow, useDisputeClientEscrow } from '@/features/hooks';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; color: string }> = {
  HELD: { label: 'Actif', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  RELEASED: { label: 'Libéré', variant: 'default', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  REFUNDED: { label: 'Remboursé', variant: 'info', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  DISPUTED: { label: 'Litige', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED: { label: 'Annulé', variant: 'default', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'active', label: 'Actifs' },
  { key: 'released', label: 'Libérés' },
  { key: 'disputed', label: 'Litiges' },
];

export default function EscrowPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [disputeModal, setDisputeModal] = useState<{ open: boolean; escrowId: string }>({ open: false, escrowId: '' });
  const [disputeReason, setDisputeReason] = useState('');

  const { data, isLoading, error, refetch } = useClientEscrows();
  const confirmMutation = useConfirmClientEscrow();
  const disputeMutation = useDisputeClientEscrow();

  const escrows = useMemo(() => {
    const d = Array.isArray(data) ? data : (data?.escrows || data?.items || []);
    return d as any[];
  }, [data]);

  const stats = useMemo(() => ({
    total: escrows.length,
    active: escrows.filter((e: any) => e.status === 'HELD' || e.status === 'PENDING').length,
    released: escrows.filter((e: any) => e.status === 'RELEASED').length,
    disputed: escrows.filter((e: any) => e.status === 'DISPUTED').length,
    totalHeld: escrows
      .filter((e: any) => e.status === 'HELD' || e.status === 'PENDING')
      .reduce((sum: number, e: any) => sum + Number(e.amount || e.montant || 0), 0),
    totalReleased: escrows
      .filter((e: any) => e.status === 'RELEASED')
      .reduce((sum: number, e: any) => sum + Number(e.amount || e.montant || 0), 0),
  }), [escrows]);

  const filtered = useMemo(() => {
    let f = [...escrows];
    switch (activeTab) {
      case 'active': f = f.filter((e: any) => ['HELD', 'PENDING'].includes(e.status)); break;
      case 'released': f = f.filter((e: any) => e.status === 'RELEASED'); break;
      case 'disputed': f = f.filter((e: any) => e.status === 'DISPUTED'); break;
    }
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((e: any) =>
        (e.reference || e.id || '').toLowerCase().includes(q) ||
        (e.businessName || e.business || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    }
    return f;
  }, [escrows, activeTab, search]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Escrow"
        description="Paiements sécurisés : vos fonds sont protégés jusqu'à confirmation de la transaction"
        breadcrumbs={[{ label: 'Escrow' }]}
      />

      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Paiement sécurisé</h2>
              <p className="text-emerald-100/80 text-sm mt-1 max-w-lg">
                Les fonds sont bloqués jusqu&apos;à ce que vous confirmiez la réception du service ou du produit.
                Vous êtes ainsi protégé en cas de litige.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Shield className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Actifs</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600"><RefreshCw className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Libérés</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.released}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Litiges</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.disputed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bloqué</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalHeld.toLocaleString()} FCFA</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Libéré</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalReleased.toLocaleString()} FCFA</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({tab.key === 'active' ? stats.active : tab.key === 'released' ? stats.released : stats.disputed})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12" />}
          title="Aucune transaction Escrow"
          description="Les transactions sécurisées apparaîtront ici lorsque vous effectuerez des achats ou réservations via Escrow."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((escrow: any) => {
            const statusInfo = STATUS_CONFIG[escrow.status] || { label: escrow.status, variant: 'default' as const, color: 'bg-gray-100 text-gray-600' };

            return (
              <Card key={escrow.id} className="p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-xl shrink-0', statusInfo.color)}>
                    <Shield className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-gray-500 font-medium">
                            #{escrow.reference || escrow.id?.slice(0, 8)}
                          </span>
                          <Badge variant={statusInfo.variant} size="xs">
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                          {escrow.description || escrow.businessName || escrow.business || 'Transaction sécurisée'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {escrow.businessName || escrow.business || 'Business'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {Number(escrow.amount || escrow.montant || 0).toLocaleString()} FCFA
                        </p>
                        {escrow.fee && (
                          <p className="text-[10px] text-gray-400">
                            Frais : {Number(escrow.fee).toLocaleString()} FCFA
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {escrow.createdAt
                          ? new Date(escrow.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })
                          : '-'}
                      </span>
                      {escrow.releasedAt && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Libéré le {new Date(escrow.releasedAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {(escrow.status === 'HELD' || escrow.status === 'PENDING') && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          size="xs" variant="primary"
                          onClick={() => confirmMutation.mutate(escrow.id)}
                          disabled={confirmMutation.isPending}
                        >
                          {confirmMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Confirmer réception
                        </Button>
                        <Button
                          size="xs" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => { setDisputeModal({ open: true, escrowId: escrow.id }); setDisputeReason(''); }}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Signaler un problème
                        </Button>
                      </div>
                    )}

                    {escrow.status === 'DISPUTED' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Button size="xs" variant="secondary">
                          <Eye className="h-3 w-3 mr-1" />
                          Voir les détails du litige
                        </Button>
                        <Button size="xs" variant="ghost">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Contacter le support
                        </Button>
                      </div>
                    )}

                    {escrow.status === 'RELEASED' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Button size="xs" variant="ghost">
                          <FileText className="h-3 w-3 mr-1" />
                          Voir le reçu
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={disputeModal.open} onClose={() => setDisputeModal({ open: false, escrowId: '' })}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Signaler un problème</h3>
          <textarea
            className="w-full border rounded-lg p-3 min-h-[100px] mb-4 text-sm"
            placeholder="Décrivez le problème rencontré..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDisputeModal({ open: false, escrowId: '' })}>Annuler</Button>
            <Button
              variant="danger"
              disabled={!disputeReason.trim() || disputeMutation.isPending}
              onClick={() => {
                disputeMutation.mutate({ id: disputeModal.escrowId, reason: disputeReason });
                setDisputeModal({ open: false, escrowId: '' });
              }}
            >
              {disputeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Ouvrir un litige
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
