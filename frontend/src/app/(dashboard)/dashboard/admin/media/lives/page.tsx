'use client';

import { useState, useMemo } from 'react';
import {
  Radio, Wifi, WifiOff, Calendar, Eye, Clock,
  XCircle, Star, Search, Users,
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
  LIVE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EN_DIRECT: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SCHEDULED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PLANIFIÉ: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ENDED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  TERMINÉ: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ANNULÉ: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CANCELLED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const MOCK_LIVES = [
  { id: '1', business: { name: 'Tech Solutions SARL' }, title: 'Lancement produit AfriBiz Pro', status: 'LIVE', viewers: 342, startTime: '2025-06-12T09:00:00Z', duration: null },
  { id: '2', business: { name: 'Mode Africa' }, title: 'Défilé de mode été 2025', status: 'PLANIFIÉ', viewers: 0, startTime: '2025-06-15T14:00:00Z', duration: null },
  { id: '3', business: { name: 'Coach Fitness Pro' }, title: 'Session live cardio', status: 'EN_DIRECT', viewers: 128, startTime: '2025-06-12T08:30:00Z', duration: null },
  { id: '4', business: { name: 'Restaurant Le Déli' }, title: 'Atelier cuisine en direct', status: 'TERMINÉ', viewers: 560, startTime: '2025-06-10T10:00:00Z', duration: 5400 },
  { id: '5', business: { name: 'Agence Digital Plus' }, title: 'Webinaire marketing', status: 'ANNULÉ', viewers: 0, startTime: '2025-06-08T15:00:00Z', duration: null },
];

function useLivesList() {
  return useQuery({
    queryKey: ['admin', 'lives'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/lives');
        return res.data.data;
      } catch {
        return MOCK_LIVES;
      }
    },
  });
}

export default function AdminLivesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: lives, isLoading } = useLivesList();
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/admin/lives/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'lives'] }); },
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      apiClient.put(`/admin/lives/${id}`, { featured }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'lives'] }); },
  });

  const list = Array.isArray(lives) ? lives : [];

  const stats = useMemo(() => {
    const liveNow = list.filter(
      (l: any) => l.status === 'LIVE' || l.status === 'EN_DIRECT'
    ).length;
    const scheduled = list.filter(
      (l: any) => l.status === 'SCHEDULED' || l.status === 'PLANIFIÉ'
    ).length;
    const ended = list.filter(
      (l: any) => l.status === 'ENDED' || l.status === 'TERMINÉ'
    ).length;
    const totalViewers = list.reduce(
      (acc: number, l: any) => acc + (l.viewers || 0), 0
    );
    return { liveNow, scheduled, ended, totalViewers };
  }, [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l: any) =>
          l.title?.toLowerCase().includes(q) ||
          l.business?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [list, search]);

  const handleEndLive = async (id: string, title: string) => {
    if (!window.confirm(`Terminer le live « ${title} » ?`)) return;
    try {
      await statusMutation.mutateAsync({ id, status: 'TERMINÉ' });
      setToast({ message: 'Live terminé', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de l\'action', type: 'error' });
    }
  };

  const handleCancel = async (id: string, title: string) => {
    if (!window.confirm(`Annuler le live planifié « ${title} » ?`)) return;
    try {
      await statusMutation.mutateAsync({ id, status: 'ANNULÉ' });
      setToast({ message: 'Live annulé', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de l\'action', type: 'error' });
    }
  };

  const handleFeature = async (id: string, featured: boolean) => {
    try {
      await featureMutation.mutateAsync({ id, featured });
      setToast({ message: featured ? 'Live mis en avant' : 'Live retiré des avant', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de l\'action', type: 'error' });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  };

  const statusLabel = (s: string) => {
    if (s === 'LIVE' || s === 'EN_DIRECT') return 'En direct';
    if (s === 'SCHEDULED' || s === 'PLANIFIÉ') return 'Planifié';
    if (s === 'ENDED' || s === 'TERMINÉ') return 'Terminé';
    if (s === 'CANCELLED' || s === 'ANNULÉ') return 'Annulé';
    return s;
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
        title="Gestion des lives"
        description="Surveillez et gérez les diffusions en direct"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média' },
          { label: 'Lives' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En direct</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.liveNow}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Planifiés</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.scheduled}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Terminés</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.ended}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Téléspectateurs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalViewers.toLocaleString()}</p>
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
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Spectateurs</th>
                  <th className="p-4 font-medium">Début</th>
                  <th className="p-4 font-medium">Durée</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l: any) => (
                  <tr key={l.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">
                      {l.business?.name || 'N/A'}
                    </td>
                    <td className="p-4 text-gray-500 max-w-[200px] truncate">{l.title}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[l.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabel(l.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Eye className="h-3.5 w-3.5" />
                        {l.viewers?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {l.startTime ? new Date(l.startTime).toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {formatDuration(l.duration)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {(l.status === 'LIVE' || l.status === 'EN_DIRECT') && (
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => handleEndLive(l.id, l.title)}
                            isLoading={statusMutation.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            Terminer
                          </Button>
                        )}
                        {(l.status === 'SCHEDULED' || l.status === 'PLANIFIÉ') && (
                          <Button
                            variant="ghost" size="xs"
                            onClick={() => handleCancel(l.id, l.title)}
                            isLoading={statusMutation.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 text-amber-500" />
                            Annuler
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="xs"
                          onClick={() => handleFeature(l.id, !l.featured)}
                          isLoading={featureMutation.isPending}
                        >
                          <Star className={`h-3.5 w-3.5 ${l.featured ? 'text-purple-500' : 'text-gray-400'}`} />
                          {l.featured ? 'Retirer' : 'Mettre en avant'}
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
            icon={<Radio className="h-8 w-8" />}
            title="Aucun live"
            description={search ? 'Aucun live ne correspond à votre recherche.' : 'Aucune diffusion en direct pour le moment.'}
          />
        )}
      </Card>
    </div>
  );
}
