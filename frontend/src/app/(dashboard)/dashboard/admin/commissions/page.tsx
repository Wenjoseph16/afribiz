'use client';

import { useState } from 'react';
import {
  Percent, Plus, Edit3, Trash2, Shield,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const SCOPES = [
  { value: 'global', label: 'Global' },
  { value: 'business_type', label: 'Type de business' },
  { value: 'developer', label: 'Développeur' },
  { value: 'plan', label: 'Plan' },
];

const emptyCommission = {
  key: '',
  label: '',
  description: '',
  rate: 0,
  scope: 'global',
  scopeValue: '',
  minFee: null as number | null,
  maxFee: null as number | null,
  currency: 'XAF',
  isActive: true,
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

function useCommissions() {
  return useQuery({
    queryKey: ['admin', 'commissions'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/commissions');
      return res.data.data;
    },
  });
}

export default function AdminCommissionsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [form, setForm] = useState<any>(emptyCommission);

  const { data: commissionsData, isLoading } = useCommissions();
  const commissions = Array.isArray(commissionsData) ? commissionsData : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/commissions', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'commissions'] }); setModal({ open: false }); setToast({ message: 'Commission créée', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la création', type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put(`/admin/commissions/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'commissions'] }); setModal({ open: false }); setToast({ message: 'Commission mise à jour', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la mise à jour', type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/commissions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'commissions'] }); setToast({ message: 'Commission supprimée', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la suppression', type: 'error' }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiClient.put(`/admin/commissions/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'commissions'] }); setToast({ message: 'Statut mis à jour', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la mise à jour', type: 'error' }),
  });

  const openCreate = () => { setForm(emptyCommission); setModal({ open: true }); };
  const openEdit = (c: any) => { setForm({ ...c }); setModal({ open: true, edit: c }); };

  const handleSave = () => {
    if (modal.edit) {
      updateMutation.mutate({ id: modal.edit.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: string, label: string) => {
    if (!window.confirm(`Supprimer la commission « ${label} » ?`)) return;
    deleteMutation.mutate(id);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Commissions</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Configuration des commissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez les taux de commission de la plateforme</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nouvelle commission</Button>
      </div>

      {isLoading ? (
        <Loader className="py-20" />
      ) : commissions.length === 0 ? (
        <EmptyState icon={<Percent className="h-8 w-8" />} title="Aucune commission" description="Créez votre première règle de commission." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Créer</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3 font-medium">Clé</th>
                <th className="p-3 font-medium">Libellé</th>
                <th className="p-3 font-medium">Taux (%)</th>
                <th className="p-3 font-medium">Portée</th>
                <th className="p-3 font-medium">Valeur</th>
                <th className="p-3 font-medium">Min/Max</th>
                <th className="p-3 font-medium">Devise</th>
                <th className="p-3 font-medium">Actif</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-3"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{c.key}</code></td>
                  <td className="p-3">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{c.label}</span>
                    {c.description && <p className="text-[11px] text-gray-400">{c.description}</p>}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-brand">{c.rate}%</span>
                  </td>
                  <td className="p-3">
                    <Badge variant="info" size="xs">{SCOPES.find(s => s.value === c.scope)?.label || c.scope}</Badge>
                  </td>
                  <td className="p-3 text-gray-500">{c.scopeValue || '-'}</td>
                  <td className="p-3 text-gray-500">
                    {c.minFee != null || c.maxFee != null
                      ? `${c.minFee != null ? c.minFee : '-'} / ${c.maxFee != null ? c.maxFee : '-'}`
                      : '-'}
                  </td>
                  <td className="p-3 text-gray-500">{c.currency || '-'}</td>
                  <td className="p-3">
                    <Toggle enabled={c.isActive} onChange={(v) => toggleMutation.mutate({ id: c.id, isActive: v })} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="xs" onClick={() => openEdit(c)}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="xs" onClick={() => handleDelete(c.id, c.label)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Modifier la commission' : 'Nouvelle commission'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Clé" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="ex: BUSINESS_COMMISSION" />
          <Input label="Libellé" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Commission business" />
          <div className="sm:col-span-2">
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Taux (%)</label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" step="0.1" value={form.rate}
                onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} className="flex-1 accent-brand" />
              <span className="text-lg font-bold text-brand min-w-[4rem] text-right">{form.rate}%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Portée</label>
            <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
              {SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <Input label="Valeur de portée" value={form.scopeValue} onChange={(e) => setForm({ ...form, scopeValue: e.target.value })} placeholder="ID ou type" />
          <Input label="Frais min" type="number" value={form.minFee ?? ''} onChange={(e) => setForm({ ...form, minFee: e.target.value ? Number(e.target.value) : null })} />
          <Input label="Frais max" type="number" value={form.maxFee ?? ''} onChange={(e) => setForm({ ...form, maxFee: e.target.value ? Number(e.target.value) : null })} />
          <Input label="Devise" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="XAF" />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button variant="secondary" onClick={() => setModal({ open: false })}>Annuler</Button>
          <Button onClick={handleSave} isLoading={createMutation.isPending || updateMutation.isPending}>
            {modal.edit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
