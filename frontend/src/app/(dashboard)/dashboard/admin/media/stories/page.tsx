'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen, CheckCircle, Archive, Trash2, Clock, Eye, MousePointerClick,
  AlertTriangle, Search, CheckSquare, Square,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

const STATUS_STYLES: Record<string, string> = {
  ACTIF: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  EXPIRED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  EXPIRÉE: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  SIGNALÉ: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REPORTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EN_ATTENTE: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ARCHIVÉ: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ARCHIVED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const MOCK_STORIES = [
  { id: '1', business: { name: 'Tech Solutions SARL' }, mediaPreview: 'Découvrez nos nouvelles offres de printemps! 🎉', expiresAt: '2025-04-15T23:59:00Z', views: 450, clicks: 32, status: 'ACTIF' },
  { id: '2', business: { name: 'Mode Africa' }, mediaPreview: 'Nouvelle collection été 2025 disponible maintenant', expiresAt: '2025-04-20T23:59:00Z', views: 890, clicks: 67, status: 'ACTIF' },
  { id: '3', business: { name: 'Restaurant Le Déli' }, mediaPreview: 'Menu spécial Ramadan - Réservez votre table', expiresAt: '2025-03-10T23:59:00Z', views: 1200, clicks: 95, status: 'EXPIRÉ' },
  { id: '4', business: { name: 'Agence Digital Plus' }, mediaPreview: 'Boostez votre SEO avec nous', expiresAt: '2025-04-25T23:59:00Z', views: 210, clicks: 8, status: 'SIGNALÉ' },
  { id: '5', business: { name: 'Artisanat Local' }, mediaPreview: 'Produits faits main - Livraison gratuite', expiresAt: '2025-04-18T23:59:00Z', views: 670, clicks: 44, status: 'ACTIF' },
];

function useStoriesList() {
  return useQuery({
    queryKey: ['admin', 'stories'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/stories');
        return res.data.data;
      } catch {
        return MOCK_STORIES;
      }
    },
  });
}

function useStoriesStatusAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/admin/stories/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'stories'] }); },
  });
}

export default function AdminStoriesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: stories, isLoading } = useStoriesList();
  const statusMutation = useStoriesStatusAction();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/stories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'stories'] }); },
  });

  const list = Array.isArray(stories) ? stories : [];

  const stats = useMemo(() => ({
    total: list.length,
    active: list.filter((s: any) => s.status === 'ACTIF' || s.status === 'ACTIVE').length,
    expired: list.filter((s: any) => s.status === 'EXPIRÉ' || s.status === 'EXPIRED').length,
    reported: list.filter((s: any) => s.status === 'SIGNALÉ' || s.status === 'REPORTED').length,
  }), [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s: any) =>
        s.business?.name?.toLowerCase().includes(q) || s.mediaPreview?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [list, search]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s: any) => s.id)));
  };

  const handleAction = async (id: string, action: string, label: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir ${label.toLowerCase()} cette story ?`)) return;
    try {
      await statusMutation.mutateAsync({ id, status: action });
      setToast({ message: `Story ${label.toLowerCase()}e avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de l'action`, type: 'error' });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement la story de « ${title} » ?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      setToast({ message: 'Story supprimée', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleBulkArchive = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Archiver ${selected.size} story(s) ?`)) return;
    try {
      await Promise.all(Array.from(selected).map((id) => statusMutation.mutateAsync({ id, status: 'ARCHIVÉ' })));
      setToast({ message: `${selected.size} story(s) archivée(s)`, type: 'success' });
      setSelected(new Set());
    } catch {
      setToast({ message: 'Erreur lors de l\'archivage', type: 'error' });
    }
  };

  const statusLabel = (s: any) => {
    if (s.status === 'ACTIF' || s.status === 'ACTIVE') return 'Actif';
    if (s.status === 'EXPIRÉ' || s.status === 'EXPIRED') return 'Expiré';
    if (s.status === 'SIGNALÉ' || s.status === 'REPORTED') return 'Signalé';
    if (s.status === 'ARCHIVÉ' || s.status === 'ARCHIVED') return 'Archivé';
    if (s.status === 'EN_ATTENTE') return 'En attente';
    return s.status;
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
        title="Modération des stories"
        description="Approuvez, archivez ou supprimez les stories signalées"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média' },
          { label: 'Stories' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Actives</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Expirées</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.expired}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Signalées</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.reported}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search + Bulk actions */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par entreprise ou contenu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          {selected.size > 0 && (
            <Button variant="secondary" size="sm" onClick={handleBulkArchive}>
              <Archive className="h-4 w-4" />
              Archiver ({selected.size})
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
                  <th className="p-4 w-10">
                    <button onClick={toggleSelectAll} className="p-0.5">
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare className="h-4 w-4 text-brand" />
                        : <Square className="h-4 w-4 text-gray-400" />
                      }
                    </button>
                  </th>
                  <th className="p-4 font-medium">Entreprise</th>
                  <th className="p-4 font-medium">Contenu</th>
                  <th className="p-4 font-medium">Expire le</th>
                  <th className="p-4 font-medium">Vues</th>
                  <th className="p-4 font-medium">Clics</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <button onClick={() => toggleSelect(s.id)} className="p-0.5">
                        {selected.has(s.id)
                          ? <CheckSquare className="h-4 w-4 text-brand" />
                          : <Square className="h-4 w-4 text-gray-400" />
                        }
                      </button>
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">
                      {s.business?.name || 'N/A'}
                    </td>
                    <td className="p-4 text-gray-500 max-w-[200px] truncate">{s.mediaPreview || '-'}</td>
                    <td className="p-4 text-gray-500 text-xs">
                      {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Eye className="h-3.5 w-3.5" />
                        {s.views?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {s.clicks?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabel(s)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {s.status !== 'ARCHIVÉ' && s.status !== 'ARCHIVED' && (
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => handleAction(s.id, 'ARCHIVÉ', 'Archiver')}
                            isLoading={statusMutation.isPending}
                          >
                            <Archive className="h-3.5 w-3.5 text-amber-500" />
                            Archiver
                          </Button>
                        )}
                        {s.status === 'SIGNALÉ' || s.status === 'REPORTED' ? (
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => handleAction(s.id, 'ACTIF', 'Approuver')}
                            isLoading={statusMutation.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            Approuver
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost" size="xs"
                          onClick={() => handleDelete(s.id, s.business?.name)}
                          isLoading={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
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
            icon={<BookOpen className="h-8 w-8" />}
            title="Aucune story"
            description={search ? 'Aucune story ne correspond à votre recherche.' : 'Aucune story à modérer pour le moment.'}
          />
        )}
      </Card>
    </div>
  );
}
