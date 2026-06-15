'use client';

import { useState } from 'react';
import {
  Flag, Plus, Search, X, ToggleLeft, ToggleRight, Pencil, Trash2, Filter,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

const SCOPES = ['GLOBAL', 'USER', 'BUSINESS', 'ADMIN'];

const SCOPE_LABELS: Record<string, string> = {
  GLOBAL: 'Global',
  USER: 'Utilisateur',
  BUSINESS: 'Business',
  ADMIN: 'Admin',
};

interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  description: string;
  scope: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FlagForm {
  key: string;
  label: string;
  description: string;
  scope: string;
  enabled: boolean;
}

const defaultForm: FlagForm = { key: '', label: '', description: '', scope: 'GLOBAL', enabled: false };

function useFlags(filters?: any) {
  return useQuery({
    queryKey: ['admin', 'feature-flags', filters],
    queryFn: async () => {
      const res = await apiClient.get('/admin/feature-flags', { params: filters });
      return res.data.data as FeatureFlag[];
    },
  });
}

export default function AdminFeatureFlagsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [enabledFilter, setEnabledFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [form, setForm] = useState<FlagForm>(defaultForm);

  const filters: any = {};
  if (search) filters.search = search;
  if (scopeFilter) filters.scope = scopeFilter;
  if (enabledFilter) filters.enabled = enabledFilter;

  const { data: flags, isLoading, error, refetch } = useFlags(filters);

  const createMutation = useMutation({
    mutationFn: (data: FlagForm) => apiClient.post('/admin/feature-flags', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FlagForm> }) => apiClient.put(`/admin/feature-flags/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/feature-flags/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/feature-flags/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }); },
  });

  const openCreate = () => {
    setEditingFlag(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setForm({ key: flag.key, label: flag.label, description: flag.description, scope: flag.scope, enabled: flag.enabled });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFlag) {
        await updateMutation.mutateAsync({ id: editingFlag.id, data: form });
        setToast({ message: 'Flag mis à jour avec succès', type: 'success' });
      } else {
        await createMutation.mutateAsync(form);
        setToast({ message: 'Flag créé avec succès', type: 'success' });
      }
      setModalOpen(false);
    } catch {
      setToast({ message: 'Erreur lors de l\'enregistrement du flag', type: 'error' });
    }
  };

  const handleDelete = async (flag: FeatureFlag) => {
    if (!window.confirm(`Supprimer le flag « ${flag.key} » ?`)) return;
    try {
      await deleteMutation.mutateAsync(flag.id);
      setToast({ message: 'Flag supprimé avec succès', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await toggleMutation.mutateAsync(flag.id);
      setToast({ message: `Flag ${flag.enabled ? 'désactivé' : 'activé'} avec succès`, type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors du basculement', type: 'error' });
    }
  };

  const hasActiveFilters = search || scopeFilter || enabledFilter;

  const clearFilters = () => {
    setSearch('');
    setScopeFilter('');
    setEnabledFilter('');
  };

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
        title="Feature Flags"
        description="Gérez les fonctionnalités activées ou désactivées sur la plateforme"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Feature Flags' },
        ]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouveau flag
          </Button>
        }
      />

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par clé ou label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Tous les scopes</option>
            {SCOPES.map((s) => (
              <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Activé</option>
            <option value="false">Désactivé</option>
          </select>
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
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : flags && flags.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Clé</th>
                  <th className="p-4 font-medium">Label</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Scope</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(flags as FeatureFlag[]).map((flag) => (
                  <tr key={flag.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{flag.key}</code>
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{flag.label}</td>
                    <td className="p-4 text-gray-500 max-w-[200px] truncate">{flag.description || '-'}</td>
                    <td className="p-4">
                      <Badge variant="info" size="xs">{SCOPE_LABELS[flag.scope] || flag.scope}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={flag.enabled ? 'success' : 'warning'} size="xs">
                        {flag.enabled ? 'Activé' : 'Désactivé'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleToggle(flag)}
                          isLoading={toggleMutation.isPending}
                          title={flag.enabled ? 'Désactiver' : 'Activer'}
                        >
                          {flag.enabled ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => openEdit(flag)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => handleDelete(flag)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
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
            title="Aucun feature flag"
            description={hasActiveFilters ? 'Aucun flag ne correspond aux filtres.' : 'Créez votre premier feature flag pour commencer.'}
            action={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" />Créer un flag</Button>}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFlag ? 'Modifier le flag' : 'Nouveau feature flag'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Clé"
            placeholder="ex: new_dashboard"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            required
          />
          <Input
            label="Label"
            placeholder="Nouveau tableau de bord"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description du feature flag..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus-ring border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 resize-none"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Scope
            </label>
            <select
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
            >
              {SCOPES.map((s) => (
                <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="rounded border-gray-300 text-brand focus:ring-brand/20"
            />
            <span className="text-gray-700 dark:text-gray-300">Activé par défaut</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingFlag ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
