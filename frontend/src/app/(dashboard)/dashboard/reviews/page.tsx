'use client';

import { Star, Edit3, Trash2, TrendingUp, Award, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useReviews } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { useQueryClient } from '@tanstack/react-query';

export default function ReviewsPage() {
  const { data, isLoading, error, refetch } = useReviews({ limit: 100 });
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const reviews = data?.reviews || data || [];

  const renderStars = (note: number, interactive = false, onRate?: (n: number) => void) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <button key={i} disabled={!interactive} onClick={() => onRate?.(i + 1)}
        className={cn(interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default')}>
        <Star className={cn('h-4 w-4', i < note ? 'text-amber-400 fill-current' : 'text-gray-200')} />
      </button>
    ));
  };

  const handleEdit = (review: any) => {
    setEditingId(review.id);
    setEditText(review.comment || review.commentaire || '');
    setEditRating(review.rating || review.note || 5);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await apiClient.patch(`/reviews/${editingId}`, { comment: editText, rating: editRating });
      qc.invalidateQueries({ queryKey: ['reviews'] });
      setEditingId(null);
    } catch { alert("Erreur lors de la modification de l'avis"); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet avis ?')) return;
    setDeletingId(id);
    try {
      await apiClient.delete(`/reviews/${id}`);
      qc.invalidateQueries({ queryKey: ['reviews'] });
    } catch { alert("Erreur lors de la suppression de l'avis"); }
    finally { setDeletingId(null); }
  };

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((a: number, r: any) => a + (r.rating || r.note || 0), 0) / reviews.length) * 10) / 10
    : 0;
  const recentCount = reviews.filter((r: any) => r.createdAt && new Date(r.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  const highRated = reviews.filter((r: any) => (r.rating || r.note || 0) >= 4).length;

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mes avis"
        description="Consultez et gérez tous les avis que vous avez publiés"
        breadcrumbs={[{ label: 'Mes avis' }]}
      />

      <Link href="/dashboard/explore">
        <Button variant="primary" className="mb-6">Donner un avis</Button>
      </Link>

      {/* Suggestions intelligentes */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            {
              icon: Star, title: `${reviews.length} avis publiés`,
              desc: `Note moyenne : ${avgRating}/5`,
              color: 'emerald' as const,
            },
            recentCount > 0 && {
              icon: Sparkles, title: `${recentCount} avis récent${recentCount > 1 ? 's' : ''}`,
              desc: 'Publiés au cours des 30 derniers jours',
              color: 'blue' as const,
            },
            highRated > 0 && {
              icon: Award, title: `${highRated} avis positif${highRated > 1 ? 's' : ''}`,
              desc: 'Notés 4 étoiles ou plus — de la visibilité pour ces business',
              color: 'purple' as const,
            },
            {
              icon: TrendingUp, title: 'Impact client',
              desc: 'Vos avis aident la communauté à faire les bons choix',
              color: 'amber' as const,
            },
          ].filter(Boolean).map((s: any, i) => {
            const colorMap: Record<string, string> = {
              emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
              blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
              purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
              amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
            };
            return (
              <div key={i}
                className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colorMap[s.color]} border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200`}>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                  <s.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-10 w-10" />}
          title="Aucun avis"
          description="Vous n'avez pas encore publié d'avis. Partagez votre expérience après un achat ou une réservation."
          action={
            <Link href="/dashboard/explore">
              <Button>Découvrir des business</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{review.businessName || review.business}</span>
                    <span className="text-xs text-gray-400">· {review.type || review.reviewType || 'Avis'}</span>
                  </div>
                  {editingId === review.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 mb-1">{renderStars(editRating, true, setEditRating)}</div>
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none" rows={3} />
                      <div className="flex gap-2">
                        <Button size="xs" onClick={handleSaveEdit}>Enregistrer</Button>
                        <Button variant="outline" size="xs" onClick={() => setEditingId(null)}>Annuler</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-0.5 mb-2">
                        {renderStars(review.rating || review.note || 0)}
                      </div>
                      <p className="text-sm text-gray-600">{review.comment || review.commentaire || ''}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : review.date || ''}
                      </p>
                    </>
                  )}
                </div>
                {editingId !== review.id && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => handleEdit(review)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(review.id)} disabled={deletingId === review.id}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
