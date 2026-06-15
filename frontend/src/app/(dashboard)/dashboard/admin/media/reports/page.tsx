'use client';

import { useState, useMemo } from 'react';
import {
  Flag, CheckCircle, XCircle, AlertTriangle, Search, Filter,
  MessageSquare, FileText, Eye,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

const CONTENT_TYPES = ['STORY', 'SHORT', 'LIVE', 'OFFER', 'AD'];
const REPORT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  STORY: 'Story',
  SHORT: 'Short',
  LIVE: 'Live',
  OFFER: 'Offre',
  AD: 'Publicité',
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  STORY: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SHORT: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LIVE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  OFFER: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  AD: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  FLAGGED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  FLAGGED: 'Signalé',
};

const MOCK_REPORTS = [
  { id: '1', reporter: { name: 'Jean Dupont' }, contentType: 'STORY', contentId: 'story-123', reason: 'Contenu inapproprié', description: 'Cette story contient des propos offensants.', createdAt: '2025-06-10T14:30:00Z', status: 'PENDING' },
  { id: '2', reporter: { name: 'Marie Koné' }, contentType: 'SHORT', contentId: 'short-456', reason: 'Spam', description: 'Vidéo promotionnelle non autorisée.', createdAt: '2025-06-11T09:15:00Z', status: 'PENDING' },
  { id: '3', reporter: { name: 'Paul Traoré' }, contentType: 'LIVE', contentId: 'live-789', reason: 'Discours haineux', description: 'Propos discriminatoires pendant le live.', createdAt: '2025-06-09T18:00:00Z', status: 'APPROVED' },
  { id: '4', reporter: { name: 'Aminata Diallo' }, contentType: 'OFFER', contentId: 'offer-321', reason: 'Fausse offre', description: 'L\'offre ne correspond pas à la description.', createdAt: '2025-06-08T11:45:00Z', status: 'REJECTED' },
  { id: '5', reporter: { name: 'Seydou Camara' }, contentType: 'AD', contentId: 'ad-654', reason: 'Publicité trompeuse', description: 'Les produits présentés ne sont pas authentiques.', createdAt: '2025-06-12T07:20:00Z', status: 'PENDING' },
];

function useReports() {
  return useQuery({
    queryKey: ['admin', 'moderation'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/moderation/items');
        return res.data.data;
      } catch {
        return MOCK_REPORTS;
      }
    },
  });
}

export default function AdminReportsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: reports, isLoading } = useReports();
  const list = Array.isArray(reports) ? reports : [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/moderation/approve/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      setDetailModal(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/admin/moderation/reject/${id}`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      setShowRejectModal(null);
      setRejectReason('');
    },
  });

  const filtered = useMemo(() => {
    let result = list;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r: any) =>
          r.reporter?.name?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q) ||
          r.contentId?.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((r: any) => r.contentType === typeFilter);
    if (statusFilter) result = result.filter((r: any) => r.status === statusFilter);
    return result;
  }, [list, search, typeFilter, statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      setToast({ message: 'Signalement approuvé', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de l\'approbation', type: 'error' });
    }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    try {
      await rejectMutation.mutateAsync({ id: showRejectModal.id, reason: rejectReason });
      setToast({ message: 'Signalement rejeté', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors du rejet', type: 'error' });
    }
  };

  const handleFlag = async (id: string) => {
    try {
      await apiClient.post(`/admin/moderation/reject/${id}`, { status: 'FLAGGED' });
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      setToast({ message: 'Contenu signalé au supérieur', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors du signalement', type: 'error' });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
  };

  const hasFilters = search || typeFilter || statusFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <PageHeader
        title="Modération des contenus"
        description="File de signalements et modération des contenus multimédias"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média' },
          { label: 'Signalements' },
        ]}
      />

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Tous les types</option>
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>{CONTENT_TYPE_LABELS[t] || t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Tous les statuts</option>
            {REPORT_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
            ))}
          </select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <Filter className="h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Signaleur</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Contenu ID</th>
                  <th className="p-4 font-medium">Raison</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">
                      {r.reporter?.name || 'Anonyme'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CONTENT_TYPE_COLORS[r.contentType] || 'bg-gray-100 text-gray-600'}`}>
                        {CONTENT_TYPE_LABELS[r.contentType] || r.contentType}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs font-mono">{r.contentId}</td>
                    <td className="p-4 text-gray-500 max-w-[200px] truncate">{r.reason}</td>
                    <td className="p-4 text-gray-500 text-xs">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="xs" onClick={() => setDetailModal(r)}>
                          <Eye className="h-3.5 w-3.5" />
                          Détails
                        </Button>
                        {r.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost" size="xs"
                              onClick={() => handleApprove(r.id)}
                              isLoading={approveMutation.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              Approuver
                            </Button>
                            <Button
                              variant="ghost" size="xs"
                              onClick={() => setShowRejectModal(r)}
                            >
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                              Rejeter
                            </Button>
                            <Button
                              variant="ghost" size="xs"
                              onClick={() => handleFlag(r.id)}
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              Flag
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Flag className="h-8 w-8" />}
            title="Aucun signalement"
            description={hasFilters ? 'Aucun signalement ne correspond aux filtres.' : 'Aucun signalement à modérer.'}
          />
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Détails du signalement" size="md">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Signaleur</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{detailModal.reporter?.name || 'Anonyme'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Type</p>
                <Badge variant={
                  detailModal.contentType === 'STORY' ? 'purple' :
                  detailModal.contentType === 'SHORT' ? 'info' :
                  detailModal.contentType === 'LIVE' ? 'danger' :
                  detailModal.contentType === 'OFFER' ? 'success' : 'warning'
                } size="sm">
                  {CONTENT_TYPE_LABELS[detailModal.contentType] || detailModal.contentType}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Contenu ID</p>
                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">{detailModal.contentId}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {detailModal.createdAt ? new Date(detailModal.createdAt).toLocaleString('fr-FR') : '-'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Raison</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{detailModal.reason}</p>
            </div>
            {detailModal.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">{detailModal.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Statut</p>
              <Badge variant={
                detailModal.status === 'PENDING' ? 'warning' :
                detailModal.status === 'APPROVED' ? 'success' :
                detailModal.status === 'REJECTED' ? 'danger' : 'default'
              } size="sm">
                {STATUS_LABELS[detailModal.status] || detailModal.status}
              </Badge>
            </div>

            {detailModal.status === 'PENDING' && (
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDetailModal(null); setShowRejectModal(detailModal); }}
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(detailModal.id)}
                  isLoading={approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approuver
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject with reason Modal */}
      <Modal open={!!showRejectModal} onClose={() => { setShowRejectModal(null); setRejectReason(''); }} title="Rejeter le signalement" description="Ajoutez un motif de rejet" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Motif du rejet</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Expliquez pourquoi ce signalement est rejeté..."
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>Annuler</Button>
            <Button variant="danger" size="sm" onClick={handleReject} isLoading={rejectMutation.isPending} disabled={!rejectReason.trim()}>
              <XCircle className="h-4 w-4" />
              Rejeter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
