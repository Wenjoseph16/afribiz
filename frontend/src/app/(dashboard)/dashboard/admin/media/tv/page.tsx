'use client';

import { useState, useMemo } from 'react';
import {
  Tv, Video, Upload, Eye, Star, Trash2, CheckCircle, XCircle,
  Film, Clock, PlayCircle, Plus, Search, Edit,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

const STATUS_STYLES: Record<string, string> = {
  PUBLIÉ: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PUBLIE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  EN_ATTENTE: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BROUILLON: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const MOCK_VIDEOS = [
  { id: '1', title: 'Lancement AfriBiz 2025', description: 'Vidéo de lancement officiel', videoUrl: 'https://youtube.com/watch?v=abc123', thumbnail: '', category: 'Événement', status: 'PUBLIÉ', views: 1280, featured: true, createdAt: '2025-01-15' },
  { id: '2', title: 'Tutoriel : Créer une boutique', description: 'Guide pas à pas', videoUrl: 'https://youtube.com/watch?v=def456', thumbnail: '', category: 'Tutoriel', status: 'PUBLIÉ', views: 3420, featured: false, createdAt: '2025-02-10' },
  { id: '3', title: 'Interview CEO', description: 'Interview exclusive', videoUrl: 'https://youtube.com/watch?v=ghi789', thumbnail: '', category: 'Interview', status: 'EN_ATTENTE', views: 0, featured: false, createdAt: '2025-03-01' },
  { id: '4', title: 'Webinaire Marketing Digital', description: 'Webinaire complet', videoUrl: 'https://vimeo.com/123456', thumbnail: '', category: 'Webinaire', status: 'BROUILLON', views: 0, featured: false, createdAt: '2025-03-05' },
  { id: '5', title: 'Témoignages clients', description: 'Retours d\'expérience', videoUrl: 'https://youtube.com/watch?v=jkl012', thumbnail: '', category: 'Témoignage', status: 'PUBLIÉ', views: 890, featured: true, createdAt: '2025-03-20' },
];

const TAB_LABELS: Record<string, string> = {
  all: 'Tous',
  published: 'Publiés',
  pending: 'En attente',
  featured: 'À la une',
};

function useTvList() {
  return useQuery({
    queryKey: ['admin', 'media', 'tv'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/media/tv');
        return res.data.data;
      } catch {
        return MOCK_VIDEOS;
      }
    },
  });
}

export default function AdminTvPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', videoUrl: '', thumbnail: '', category: '', featured: false,
  });

  const { data: videos, isLoading } = useTvList();
  const list = Array.isArray(videos) ? videos : [];

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/admin/media/tv/${id}`, { status: 'PUBLIÉ' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'media', 'tv'] }); },
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/admin/media/tv/${id}`, { status: 'EN_ATTENTE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'media', 'tv'] }); },
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => apiClient.put(`/admin/media/tv/${id}`, { featured }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'media', 'tv'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/media/tv/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'media', 'tv'] }); },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/media/tv', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'media', 'tv'] });
      setShowCreateModal(false);
      setForm({ title: '', description: '', videoUrl: '', thumbnail: '', category: '', featured: false });
      setToast({ message: 'Vidéo créée avec succès', type: 'success' });
    },
    onError: () => setToast({ message: 'Erreur lors de la création', type: 'error' }),
  });

  const stats = useMemo(() => ({
    total: list.length,
    published: list.filter((v: any) => v.status === 'PUBLIÉ' || v.status === 'PUBLIE').length,
    pending: list.filter((v: any) => v.status === 'EN_ATTENTE').length,
    featured: list.filter((v: any) => v.featured).length,
  }), [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (tab === 'published') result = result.filter((v: any) => v.status === 'PUBLIÉ' || v.status === 'PUBLIE');
    if (tab === 'pending') result = result.filter((v: any) => v.status === 'EN_ATTENTE');
    if (tab === 'featured') result = result.filter((v: any) => v.featured);
    if (search) result = result.filter((v: any) => v.title.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [list, tab, search]);

  const handleAction = async (action: string, video: any) => {
    const confirmMessages: Record<string, string> = {
      publish: 'publier',
      unpublish: 'dépublier',
      feature: 'mettre en avant',
      unfeature: 'retirer des vedettes',
      delete: 'supprimer',
    };

    if (action === 'delete') {
      if (!window.confirm(`Supprimer la vidéo « ${video.title} » ?`)) return;
      try {
        await deleteMutation.mutateAsync(video.id);
        setToast({ message: 'Vidéo supprimée', type: 'success' });
      } catch {
        setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      }
      return;
    }

    if (action === 'publish') {
      try {
        await publishMutation.mutateAsync(video.id);
        setToast({ message: 'Vidéo publiée', type: 'success' });
      } catch {
        setToast({ message: 'Erreur lors de la publication', type: 'error' });
      }
      return;
    }

    if (action === 'unpublish') {
      try {
        await unpublishMutation.mutateAsync(video.id);
        setToast({ message: 'Vidéo dépubliée', type: 'success' });
      } catch {
        setToast({ message: 'Erreur lors du dépublication', type: 'error' });
      }
      return;
    }

    if (action === 'feature' || action === 'unfeature') {
      const newFeatured = action === 'feature';
      try {
        await featureMutation.mutateAsync({ id: video.id, featured: newFeatured });
        setToast({ message: newFeatured ? 'Vidéo mise en avant' : 'Vidéo retirée des vedettes', type: 'success' });
      } catch {
        setToast({ message: 'Erreur lors de la modification', type: 'error' });
      }
      return;
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
        title="AfriBiz TV"
        description="Gérez les vidéos, tutoriels et contenus multimédias"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média' },
          { label: 'AfriBiz TV' },
        ]}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle vidéo
          </Button>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total vidéos</p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Publiées</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.published}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">À la une</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.featured}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Tabs
            tabs={[
              { id: 'all', label: 'Tous', badge: stats.total },
              { id: 'published', label: 'Publiés', badge: stats.published },
              { id: 'pending', label: 'En attente', badge: stats.pending },
              { id: 'featured', label: 'À la une', badge: stats.featured },
            ]}
            activeTab={tab}
            onChange={setTab}
            variant="underline"
          />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
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
                  <th className="p-4 font-medium">Titre</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Vues</th>
                  <th className="p-4 font-medium">À la une</th>
                  <th className="p-4 font-medium">Catégorie</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v: any) => (
                  <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                          <Video className="h-5 w-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{v.title}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{v.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[v.status] || 'bg-gray-100 text-gray-600'}`}>
                        {v.status === 'PUBLIE' ? 'Publié' : v.status === 'PUBLIÉ' ? 'Publié' : v.status === 'EN_ATTENTE' ? 'En attente' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        {v.views?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="p-4">
                      {v.featured ? (
                        <Badge variant="purple" size="xs">À la une</Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500">{v.category || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {v.status !== 'PUBLIÉ' && v.status !== 'PUBLIE' && (
                          <Button variant="ghost" size="xs" onClick={() => handleAction('publish', v)} isLoading={publishMutation.isPending}>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            Publier
                          </Button>
                        )}
                        {(v.status === 'PUBLIÉ' || v.status === 'PUBLIE') && (
                          <Button variant="ghost" size="xs" onClick={() => handleAction('unpublish', v)} isLoading={unpublishMutation.isPending}>
                            <XCircle className="h-3.5 w-3.5 text-amber-500" />
                            Dépublier
                          </Button>
                        )}
                        <Button variant="ghost" size="xs" onClick={() => handleAction(v.featured ? 'unfeature' : 'feature', v)} isLoading={featureMutation.isPending}>
                          <Star className={`h-3.5 w-3.5 ${v.featured ? 'text-purple-500' : 'text-gray-400'}`} />
                          {v.featured ? 'Retirer' : 'À la une'}
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => handleAction('delete', v)} isLoading={deleteMutation.isPending}>
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
            icon={<Tv className="h-8 w-8" />}
            title="Aucune vidéo"
            description={search ? 'Aucune vidéo ne correspond à votre recherche.' : 'Commencez par créer une nouvelle vidéo.'}
            action={!search && <Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" />Créer une vidéo</Button>}
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle vidéo"
        description="Ajoutez une nouvelle vidéo à AfriBiz TV"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Titre"
            placeholder="Titre de la vidéo"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              placeholder="Description de la vidéo"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
            />
          </div>
          <Input
            label="URL de la vidéo (YouTube / Vimeo)"
            placeholder="https://youtube.com/watch?v=..."
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          />
          <Input
            label="URL de la miniature"
            placeholder="https://..."
            value={form.thumbnail}
            onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
          />
          <Input
            label="Catégorie"
            placeholder="Ex: Tutoriel, Webinaire, Interview..."
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-brand focus:ring-brand/20"
            />
            <label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mettre en avant (À la une)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              isLoading={createMutation.isPending}
              disabled={!form.title || !form.videoUrl}
            >
              <Upload className="h-4 w-4" />
              Créer la vidéo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
