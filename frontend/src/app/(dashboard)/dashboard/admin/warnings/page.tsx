'use client';

import { useState } from 'react';
import {
  AlertTriangle, Plus, Shield, Search, X, ChevronLeft, ChevronRight,
  Ban, CheckCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Actif', EXPIRED: 'Expiré' };
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EXPIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

function useWarnings(params?: any) {
  return useQuery({
    queryKey: ['admin', 'warnings', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/warnings', { params });
      return res.data.data;
    },
  });
}

function useWarningsStats() {
  return useQuery({
    queryKey: ['admin', 'warnings', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/warnings/stats');
      return res.data.data;
    },
  });
}

function useUsersSearch() {
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await apiClient.get('/admin/users', { params: { search: query, limit: 10 } });
      return res.data.data;
    },
  });
}

export default function AdminWarningsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [issuModal, setIssuModal] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 20;

  const [warnForm, setWarnForm] = useState({
    userId: '', reason: '', description: '', action: '', expiresAt: '',
  });
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const params: any = { page, limit };
  if (statusFilter) params.status = statusFilter;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const { data: warningsData, isLoading } = useWarnings(params);
  const { data: stats } = useWarningsStats();
  const usersSearchMutation = useUsersSearch();
  const warnings = Array.isArray(warningsData) ? warningsData : warningsData?.warnings ?? [];
  const totalPages = warningsData?.totalPages ?? 1;

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post(`/admin/users/${warnForm.userId}/warnings`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'warnings'] });
      setIssuModal(false);
      setWarnForm({ userId: '', reason: '', description: '', action: '', expiresAt: '' });
      setSelectedUser(null);
      setUserResults([]);
      setUserSearch('');
      setToast({ message: 'Avertissement émis avec succès', type: 'success' });
    },
    onError: () => setToast({ message: 'Erreur lors de l\'émission', type: 'error' }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/warnings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'warnings'] });
      setToast({ message: 'Avertissement révoqué', type: 'success' });
    },
    onError: () => setToast({ message: 'Erreur lors de la révocation', type: 'error' }),
  });

  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) { setUserResults([]); return; }
    try {
      const result = await usersSearchMutation.mutateAsync(q);
      const list = Array.isArray(result) ? result : result?.users ?? [];
      setUserResults(list);
    } catch { setUserResults([]); }
  };

  const selectUser = (u: any) => {
    setSelectedUser({ id: u.id, name: u.name || u.email, email: u.email });
    setWarnForm({ ...warnForm, userId: u.id });
    setUserResults([]);
    setUserSearch(u.name || u.email);
  };

  const handleIssueWarn = () => {
    if (!warnForm.userId || !warnForm.reason) {
      setToast({ message: 'Veuillez sélectionner un utilisateur et saisir un motif', type: 'error' });
      return;
    }
    createMutation.mutate({
      reason: warnForm.reason,
      description: warnForm.description,
      action: warnForm.action || undefined,
      expiresAt: warnForm.expiresAt || undefined,
    });
  };

  const handleRevoke = (id: string) => {
    if (!window.confirm('Révoquer cet avertissement ?')) return;
    revokeMutation.mutate(id);
  };

  const clearFilters = () => { setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(1); };
  const hasActiveFilters = statusFilter || dateFrom || dateTo;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Avertissements</h1>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Gestion des avertissements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Émettez et gérez les avertissements utilisateurs</p>
        </div>
        <Button onClick={() => { setWarnForm({ userId: '', reason: '', description: '', action: '', expiresAt: '' }); setSelectedUser(null); setUserSearch(''); setUserResults([]); setIssuModal(true); }}>
          <Plus className="h-4 w-4" /> Émettre un avertissement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.total ?? '-'}</p><p className="text-xs text-gray-500">Total émis</p></div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><AlertTriangle className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.active ?? '-'}</p><p className="text-xs text-gray-500">Actifs</p></div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500"><CheckCircle className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.expired ?? '-'}</p><p className="text-xs text-gray-500">Expirés</p></div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="EXPIRED">Expiré</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Du</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
            <span className="text-xs text-gray-500">Au</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}><X className="h-4 w-4" /> Effacer</Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : warnings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Utilisateur</th>
                  <th className="p-4 font-medium">Émis par</th>
                  <th className="p-4 font-medium">Motif</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Expire le</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warnings.map((w: any) => (
                  <tr key={w.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{w.user?.name || w.user?.email || w.userId?.slice(0, 8) || '-'}</span>
                    </td>
                    <td className="p-4 text-gray-500">{w.issuedBy?.name || w.issuedById?.slice(0, 8) || '-'}</td>
                    <td className="p-4">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{w.reason}</span>
                        {w.description && <p className="text-xs text-gray-400 mt-0.5">{w.description}</p>}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{w.action || '-'}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {w.expiresAt ? new Date(w.expiresAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {w.createdAt ? new Date(w.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[w.status] || ''}`}>
                        {STATUS_LABELS[w.status] || w.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {w.status === 'ACTIVE' && (
                        <Button variant="ghost" size="xs" onClick={() => handleRevoke(w.id)} isLoading={revokeMutation.isPending}>
                          <Ban className="h-3.5 w-3.5 text-red-500" /> Révoquer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="Aucun avertissement"
            description={hasActiveFilters ? 'Aucun résultat pour ces filtres.' : 'Aucun avertissement émis.'}
          />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Issue Warning Modal */}
      <Modal open={issuModal} onClose={() => setIssuModal(false)} title="Émettre un avertissement" size="lg">
        <div className="space-y-4">
          {/* User search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Utilisateur</label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => { setSelectedUser(null); setWarnForm({ ...warnForm, userId: '' }); setUserSearch(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Rechercher un utilisateur..." value={userSearch}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
                {userResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {userResults.map((u: any) => (
                      <button key={u.id} onClick={() => selectUser(u)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="font-medium">{u.name || u.email}</span>
                        {u.email && <span className="text-gray-500 ml-2">({u.email})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Input label="Motif *" value={warnForm.reason} onChange={(e) => setWarnForm({ ...warnForm, reason: e.target.value })} placeholder="Ex: Non-respect des CGU" />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={warnForm.description} onChange={(e) => setWarnForm({ ...warnForm, description: e.target.value })} rows={3} placeholder="Détails de l'avertissement..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none" />
          </div>
          <Input label="Action (optionnelle)" value={warnForm.action} onChange={(e) => setWarnForm({ ...warnForm, action: e.target.value })} placeholder="Ex: Suspension temporaire" />
          <Input label="Expiration (optionnelle)" type="date" value={warnForm.expiresAt} onChange={(e) => setWarnForm({ ...warnForm, expiresAt: e.target.value })} />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button variant="secondary" onClick={() => setIssuModal(false)}>Annuler</Button>
          <Button onClick={handleIssueWarn} isLoading={createMutation.isPending} disabled={!warnForm.userId || !warnForm.reason}>
            <AlertTriangle className="h-4 w-4" /> Émettre
          </Button>
        </div>
      </Modal>
    </div>
  );
}
