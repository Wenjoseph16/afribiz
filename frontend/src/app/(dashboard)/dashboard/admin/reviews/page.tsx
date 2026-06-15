'use client';

import { useState } from 'react';
import {
  Star, MessageSquare, Code2, Package, Flag, Shield,
  CheckCircle, EyeOff, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type ReviewTab = 'business' | 'developers' | 'modules' | 'signales';

interface Review {
  id: string;
  author?: { name: string; email: string };
  authorName?: string;
  target?: { name: string };
  targetName?: string;
  rating: number;
  content?: string;
  comment?: string;
  status: string;
  createdAt: string;
}

const TABS: { id: ReviewTab; label: string; icon: any }[] = [
  { id: 'business', label: 'Avis business', icon: Star },
  { id: 'developers', label: 'Avis développeurs', icon: Code2 },
  { id: 'modules', label: 'Avis modules', icon: Package },
  { id: 'signales', label: 'Signalés', icon: Flag },
];

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Approuvé',
  HIDDEN: 'Masqué',
  PENDING: 'En attente',
  REPORTED: 'Signalé',
};

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  HIDDEN: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REPORTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function useAdminReviews(params?: any) {
  return useQuery({
    queryKey: ['admin', 'reviews', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/reviews', { params });
      return res.data.data;
    },
  });
}

function useAdminReviewAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.put(`/admin/reviews/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
  });
}

function useAdminReviewDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
  });
}

export default function AdminReviewsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [activeTab, setActiveTab] = useState<ReviewTab>('business');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const limit = 20;

  const params: any = { page, limit, type: activeTab };

  const { data: reviewsData, isLoading } = useAdminReviews(params);
  const actionMutation = useAdminReviewAction();
  const deleteMutation = useAdminReviewDelete();

  const reviews: Review[] = Array.isArray(reviewsData)
    ? reviewsData
    : reviewsData?.reviews ?? [];
  const totalPages = reviewsData?.totalPages ?? 1;

  const handleAction = async (id: string, action: string, label: string) => {
    const confirmed = window.confirm(`Confirmer l'action « ${label} » sur cet avis ?`);
    if (!confirmed) return;
    try {
      await actionMutation.mutateAsync({ id, action });
      setToast({ message: `Avis ${label.toLowerCase()} avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de « ${label} »`, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet avis ?');
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
      setToast({ message: 'Avis supprimé avec succès', type: 'success' });
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Modération des avis
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Modération des avis
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Approuvez, masquez ou supprimez les avis de la plateforme
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Reviews Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Auteur</th>
                  <th className="p-4 font-medium">Cible</th>
                  <th className="p-4 font-medium">Note</th>
                  <th className="p-4 font-medium">Avis</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                          {(review.author?.name || review.authorName || 'A')?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {review.author?.name || review.authorName || 'Anonyme'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">
                      {review.target?.name || review.targetName || '-'}
                    </td>
                    <td className="p-4">
                      {renderStars(review.rating)}
                    </td>
                    <td className="p-4 max-w-[250px]">
                      <p className="truncate text-gray-600 dark:text-gray-300">
                        {review.content || review.comment || '-'}
                      </p>
                    </td>
                    <td className="p-4 text-gray-500 whitespace-nowrap text-xs">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        STATUS_STYLES[review.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {STATUS_LABELS[review.status] || review.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {review.status !== 'APPROVED' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(review.id, 'approve', 'Approuver')}
                            isLoading={actionMutation.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            Approuver
                          </Button>
                        )}
                        {review.status !== 'HIDDEN' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(review.id, 'hide', 'Masquer')}
                            isLoading={actionMutation.isPending}
                          >
                            <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                            Masquer
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDelete(review.id)}
                          isLoading={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          Supprimer
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
            icon={<MessageSquare className="h-8 w-8" />}
            title="Aucun avis"
            description="Aucun avis trouvé pour cette catégorie."
          />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
