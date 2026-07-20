'use client';

import { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Play,
  Pause,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

interface AdminCampaignStep {
  id?: string;
  stepOrder: number;
  name: string;
  actionType: string;
  actionConfig?: Record<string, unknown>;
  delayMinutes?: number;
  delayHours?: number;
  delayDays?: number;
}

interface ExecutionLog {
  id: string;
  result: string;
  executedAt: string;
}

interface AdminCampaign {
  id: string;
  name: string;
  trigger: string;
  description?: string;
  status: string;
  scheduledAt?: string;
  startedAt?: string;
  createdAt: string;
  steps?: AdminCampaignStep[];
  executionLogs?: ExecutionLog[];
  _count?: { steps: number };
}

const STATUS_OPTIONS = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SCHEDULED: 'Planifiée',
  ACTIVE: 'Active',
  COMPLETED: 'Terminée',
  PAUSED: 'Suspendue',
  CANCELLED: 'Annulée',
};
const STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'info' | 'danger'> = {
  DRAFT: 'default',
  SCHEDULED: 'info',
  ACTIVE: 'success',
  COMPLETED: 'success',
  PAUSED: 'warning',
  CANCELLED: 'danger',
};
const TRIGGERS = [
  'ORDER_PLACED',
  'PAYMENT_RECEIVED',
  'NEW_CLIENT',
  'CLIENT_INACTIVE',
  'REVIEW_PUBLISHED',
  'SUBSCRIPTION_EXPIRING',
  'BADGE_EARNED',
];

export default function AdminCampaignsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdminCampaign | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<AdminCampaign | null>(null);
  const [form, setForm] = useState<Record<string, string>>({
    name: '',
    trigger: '',
    description: '',
    scheduledAt: '',
    steps: '',
  });
  const limit = 15;

  const filters: Record<string, unknown> = { page, limit };
  if (search) filters.search = search;
  if (statusFilter) filters.status = statusFilter;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'campaigns', filters],
    queryFn: async () => {
      const res = await apiClient.adminGetCampaigns(filters);
      return { campaigns: res.data.data || [], totalPages: 1 };
    },
  });
  const campaigns = Array.isArray(data?.campaigns) ? data.campaigns : [];

  const createMutation = useMutation({
    mutationFn: (d: any) =>
      apiClient.adminCreateCampaign({ ...d, steps: d.steps ? JSON.parse(d.steps) : [] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => apiClient.adminUpdateCampaign(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminDeleteCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });
  const startMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminStartCampaign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });

  const openCreate = () => {
    setEditingCampaign(null);
    setForm({ name: '', trigger: '', description: '', scheduledAt: '', steps: '' });
    setModalOpen(true);
  };
  const openEdit = (c: AdminCampaign) => {
    setEditingCampaign(c);
    setForm({
      name: c.name,
      trigger: c.trigger,
      description: c.description || '',
      scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : '',
      steps: JSON.stringify(c.steps || [], null, 2),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = { ...form };
      if (form.scheduledAt) payload.scheduledAt = new Date(form.scheduledAt).toISOString();
      if (editingCampaign) {
        await updateMutation.mutateAsync({ id: editingCampaign.id, d: payload });
        setToast({ message: 'Campagne mise à jour', type: 'success' });
      } else {
        await createMutation.mutateAsync(payload);
        setToast({ message: 'Campagne créée', type: 'success' });
      }
      setModalOpen(false);
    } catch {
      setToast({ message: 'Erreur', type: 'error' });
    }
  };

  const [deleteCampaignTarget, setDeleteCampaignTarget] = useState<AdminCampaign | null>(null);

  const confirmDeleteCampaign = async () => {
    if (!deleteCampaignTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteCampaignTarget.id);
      setToast({ message: 'Campagne supprimée', type: 'success' });
    } catch {
      setToast({ message: 'Erreur suppression', type: 'error' });
    }
    setDeleteCampaignTarget(null);
  };

  const handleDelete = async (c: AdminCampaign) => {
    setDeleteCampaignTarget(c);
  };

  const handleStart = async (c: AdminCampaign) => {
    try {
      await startMutation.mutateAsync(c.id);
      setToast({ message: 'Campagne démarrée', type: 'success' });
    } catch {
      setToast({ message: 'Erreur démarrage', type: 'error' });
    }
  };

  const openDetails = (c: AdminCampaign) => {
    setSelectedCampaign(c);
    setDetailsModalOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };
  const hasActiveFilters = search || statusFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div
          className={`p-3 rounded-xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">
            &times;
          </button>
        </div>
      )}

      <PageHeader
        title="Campagnes Marketing"
        description="Gérez les campagnes multi-étapes automatisées"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Campagnes' },
        ]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle campagne
          </Button>
        }
      />

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
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Tous les statuts' },
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ]}
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>
      </Card>

      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Nom</th>
                  <th className="p-4 font-medium">Déclencheur</th>
                  <th className="p-4 font-medium">Étapes</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Planifiée</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: AdminCampaign) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{c.name}</td>
                    <td className="p-4">
                      <Badge variant="info" size="xs">
                        {c.trigger?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-500">
                      {c._count?.steps ?? c.steps?.length ?? 0} étapes
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_VARIANTS[c.status]} size="xs">
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="xs" onClick={() => openDetails(c)}>
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                        {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleStart(c)}
                            isLoading={startMutation.isPending}
                          >
                            <Play className="h-3.5 w-3.5 text-emerald-500" />
                          </Button>
                        )}
                        {(c.status === 'DRAFT' || c.status === 'PAUSED') && (
                          <Button variant="ghost" size="xs" onClick={() => openEdit(c)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {c.status === 'DRAFT' && (
                          <Button variant="ghost" size="xs" onClick={() => handleDelete(c)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
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
            icon={<Megaphone className="h-8 w-8" />}
            title="Aucune campagne"
            description="Créez votre première campagne multi-étapes."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Créer
              </Button>
            }
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCampaign ? 'Modifier la campagne' : 'Nouvelle campagne'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1.5">Déclencheur</label>
            <Select
              value={form.trigger}
              onChange={(e) => setForm({ ...form, trigger: e.target.value })}
              options={[
                { value: '', label: 'Sélectionner' },
                ...TRIGGERS.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
              ]}
            />
          </div>
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Input
            label="Planifier le"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium mb-1.5">Étapes (JSON)</label>
            <textarea
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              rows={8}
              placeholder='[{"stepOrder":1,"name":"Etape 1","actionType":"SEND_NOTIFICATION","actionConfig":{"title":"Bonjour"},"delayMinutes":0}]'
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand font-mono text-xs resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingCampaign ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedCampaign(null);
        }}
        title={`Campagne : ${selectedCampaign?.name || ''}`}
        size="xl"
      >
        {selectedCampaign && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                <Badge variant={STATUS_VARIANTS[selectedCampaign.status]}>
                  {STATUS_LABELS[selectedCampaign.status]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Déclencheur</p>
                <Badge variant="info">{selectedCampaign.trigger?.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Créée le</p>
                <p className="text-sm">
                  {new Date(selectedCampaign.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              {selectedCampaign.startedAt && (
                <div>
                  <p className="text-xs text-gray-500">Démarrée le</p>
                  <p className="text-sm">
                    {new Date(selectedCampaign.startedAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
            {selectedCampaign.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedCampaign.description}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold mb-2">
                Étapes ({selectedCampaign.steps?.length || 0})
              </p>
              {(selectedCampaign.steps || []).map((step: AdminCampaignStep, i: number) => (
                <div
                  key={step.id || i}
                  className="p-3 mb-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      #{step.stepOrder} {step.name}
                    </span>
                    <Badge variant="info" size="xs">
                      {step.actionType?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {step.delayMinutes ? (
                    <p className="text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline" /> Délai: {step.delayMinutes}min
                    </p>
                  ) : null}
                  {step.delayHours ? (
                    <p className="text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline" /> Délai: {step.delayHours}h
                    </p>
                  ) : null}
                  {step.delayDays ? (
                    <p className="text-xs text-gray-500">
                      <Clock className="h-3 w-3 inline" /> Délai: {step.delayDays}j
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            {(selectedCampaign.executionLogs?.length ?? 0) > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Logs d'exécution</p>
                {(selectedCampaign.executionLogs ?? []).slice(0, 10).map((log: ExecutionLog) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 text-xs border-b border-gray-100 dark:border-gray-800"
                  >
                    <span>
                      <Badge variant={log.result === 'SUCCESS' ? 'success' : 'danger'} size="xs">
                        {log.result}
                      </Badge>
                    </span>
                    <span className="text-gray-500">
                      {new Date(log.executedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <ConfirmationModal
          open={!!deleteCampaignTarget}
          onClose={() => setDeleteCampaignTarget(null)}
          onConfirm={confirmDeleteCampaign}
          title="Supprimer la campagne"
          description={
            deleteCampaignTarget ? `Supprimer la campagne "${deleteCampaignTarget.name}" ?` : ''
          }
          confirmLabel="Supprimer"
          variant="danger"
        />
      </Modal>
    </div>
  );
}
