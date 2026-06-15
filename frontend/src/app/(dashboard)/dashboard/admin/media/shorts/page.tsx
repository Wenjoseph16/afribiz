'use client';

import { useState, useMemo } from 'react';
import {
  Video, PlayCircle, ThumbsUp, Eye, Bookmark, Search,
  PauseCircle, Trash2, AlertTriangle,
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
  SUSPENDU: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SUSPENDED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SIGNALÉ: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REPORTED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EN_ATTENTE: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const MOCK_SHORTS = [
  { id: '1', business: { name: 'Tech Solutions SARL' }, title: 'Astuce React en 60s', videoUrl: 'https://example.com/short1.mp4', duration: 60, likes: 234, views: 5400, saves: 89, status: 'ACTIF' },
  { id: '2', business: { name: 'Mode Africa' }, title: 'Tenue du jour', videoUrl: 'https://example.com/short2.mp4', duration: 45, likes: 567, views: 12300, saves: 210, status: 'ACTIF' },
  { id: '3', business: { name: 'Restaurant Le Déli' }, title: 'Recette express', videoUrl: 'https://example.com/short3.mp4', duration: 90, likes: 45, views: 890, saves: 12, status: 'SIGNALÉ' },
  { id: '4', business: { name: 'Coach Fitness Pro' }, title: 'Exercice abdos 5 min', videoUrl: 'https://example.com/short4.mp4', duration: 120, likes: 890, views: 23400, saves: 678, status: 'ACTIF' },
  { id: '5', business: { name: 'Agence Digital Plus' }, title: 'Tendance SEO 2025', videoUrl: 'https://example.com/short5.mp4', duration: 75, likes: 123, views: 3200, saves: 45, status: 'SUSPENDU' },
];

function useShortsList() {
  return useQuery({
    queryKey: ['admin', 'shorts'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/shorts');
        return res.data.data;
      } catch {
        return MOCK_SHORTS;
      }
    },
  });
}

export default function AdminShortsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: shorts, isLoading } = useShortsList();
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/admin/shorts/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'shorts'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/shorts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'shorts'] }); },
  });

  const list = Array.isArray(shorts) ? shorts : [];

  const stats = useMemo(() => ({
    total: list.length,
    active: list.filter((s: any) => s.status === 'ACTIF' || s.status === 'ACTIVE').length,
    reported: list.filter((s: any) => s.status === 'SIGNALÉ' || s.status === 'REPORTED').length,
  }), [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s: any) =>
        s.title?.toLowerCase().includes(q) || s.business?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [list, search]);

  const handleStatusAction = async (id: string, status: string, label: string) => {
    const actionLabel = status === 'ACTIF' ? 'activer' : status === 'SUSPENDU' ? 'suspendre' : label;
    if (!window.confirm(`Êtes-vous sûr de vouloir ${actionLabel} ce short ?`)) return;
    try {
      await statusMutation.mutateAsync({ id, status });
      setToast({ message: `Short ${actionLabel} avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de l'action`, type: 'error' });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement le short « ${title} » ?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      setToast({ message: 'Short supprimé', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statusLabel = (s: any) => {
    if (s.status === 'ACTIF' || s.status === 'ACTIVE') return 'Actif';
    if (s.status === 'SUSPENDU' || s.status === 'SUSPENDED') return 'Suspendu';
    if (s.status === 'SIGNALÉ' || s.status === 'REPORTED') return 'Signalé';
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
        title="Gestion des shorts"
        description="Modérez et gérez les courtes vidéos des entreprises"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média' },
          { label: 'Shorts' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand">
              <Video className="h-5 w-5" />
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
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Actifs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Signalés</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.reported}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card padding="md">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre ou entreprise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
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
                  <th className="p-4 font-medium">Entreprise</th>
                  <th className="p-4 font-medium">Titre</th>
                  <th className="p-4 font-medium">Durée</th>
                  <th className="p-4 font-medium">Vues</th>
                  <th className="p-4 font-medium">Likes</th>
                  <th className="p-4 font-medium">Sauvegardes</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">
                      {s.business?.name || 'N/A'}
                    </td>
                    <td className="p-4 text-gray-500 max-w-[180px] truncate">{s.title}</td>
                    <td className="p-4 text-gray-500 text-xs">
                      {s.duration ? formatDuration(s.duration) : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Eye className="h-3.5 w-3.5" />
                        {s.views?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {s.likes?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Bookmark className="h-3.5 w-3.5" />
                        {s.saves?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[s.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabel(s)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {(s.status === 'ACTIF' || s.status === 'ACTIVE') && (
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => handleStatusAction(s.id, 'SUSPENDU', 'suspendre')}
                            isLoading={statusMutation.isPending}
                          >
                            <PauseCircle className="h-3.5 w-3.5 text-red-500" />
                            Suspendre
                          </Button>
                        )}
                        {(s.status === 'SUSPENDU' || s.status === 'SUSPENDED') && (
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => handleStatusAction(s.id, 'ACTIF', 'activer')}
                            isLoading={statusMutation.isPending}
                          >
                            <PlayCircle className="h-3.5 w-3.5 text-emerald-500" />
                            Activer
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="xs"
                          onClick={() => handleDelete(s.id, s.title)}
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
            icon={<Video className="h-8 w-8" />}
            title="Aucun short"
            description={search ? 'Aucun short ne correspond à votre recherche.' : 'Aucun short à modérer pour le moment.'}
          />
        )}
      </Card>
    </div>
  );
}
