'use client';

import { useState } from 'react';
import {
  Key, Plus, ChevronLeft, ChevronRight, RefreshCw, 
  PauseCircle, Play, Trash2, Shield, X, CheckCircle, XCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

export default function AdminApiKeysPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState({ partnerName: '', type: 'READ' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'api-keys', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/api-keys', { params: { page, limit } });
      return res.data.data || { keys: [], totalPages: 1 };
    },
    enabled: isAdmin,
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/api-keys/${id}/regenerate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'api-keys'] }); setToast({ message: 'Clé régénérée avec succès', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de la régénération', type: 'error' }); },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/api-keys/${id}/suspend`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'api-keys'] }); setToast({ message: 'Clé suspendue', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de la suspension', type: 'error' }); },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/api-keys/${id}/activate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'api-keys'] }); setToast({ message: 'Clé activée', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de l\'activation', type: 'error' }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/api-keys/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'api-keys'] }); setToast({ message: 'Clé supprimée', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de la suppression', type: 'error' }); },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/api-keys', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'api-keys'] }); setShowCreateModal(false); setNewKey({ partnerName: '', type: 'READ' }); setToast({ message: 'Clé API créée', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de la création', type: 'error' }); },
  });

  const keys = Array.isArray(data) ? data : data?.keys ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Clés API</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur pour accéder à cette page." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto font-bold">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Clés API</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des clés d&apos;accès API partenaires</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" /> Nouvelle clé
        </Button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nouvelle clé API</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom du partenaire</label>
                <input
                  type="text"
                  value={newKey.partnerName}
                  onChange={(e) => setNewKey((prev) => ({ ...prev, partnerName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                <select
                  value={newKey.type}
                  onChange={(e) => setNewKey((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
                >
                  <option value="READ">Lecture seule</option>
                  <option value="WRITE">Écriture</option>
                  <option value="ADMIN">Administration</option>
                  <option value="FULL">Complet</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Annuler</Button>
                <Button onClick={() => createMutation.mutate(newKey)} isLoading={createMutation.isPending}>Créer</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Partenaire</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Clé API</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Quota</th>
                  <th className="p-4 font-medium">Dernier appel</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k: any) => (
                  <tr key={k.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{k.partnerName || k.partner?.name || '-'}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{k.type || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-gray-500">{k.apiKey ? `${k.apiKey.slice(0, 12)}...${k.apiKey.slice(-4)}` : '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        k.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        k.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{k.status || '-'}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-500">{k.usedQuota ?? 0}/{k.quota ?? '-'}</td>
                    <td className="p-4 text-xs text-gray-500">{k.lastCall ? new Date(k.lastCall).toLocaleString('fr-FR') : '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="xs" onClick={() => regenerateMutation.mutate(k.id)}>
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        {k.status === 'ACTIVE' ? (
                          <Button variant="ghost" size="xs" onClick={() => suspendMutation.mutate(k.id)}>
                            <PauseCircle className="h-3 w-3 text-amber-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="xs" onClick={() => activateMutation.mutate(k.id)}>
                            <Play className="h-3 w-3 text-emerald-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="xs" onClick={() => {
                          if (window.confirm('Supprimer cette clé API ?')) deleteMutation.mutate(k.id);
                        }}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Key className="h-8 w-8" />} title="Aucune clé API" description="Les clés API partenaires apparaîtront ici." />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} sur {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
