'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star, MessageCircle, Reply, ThumbsUp, ThumbsDown, Flag, Lightbulb, Send,
  ChevronDown, ChevronUp, User, Calendar, AlertTriangle, CheckCircle, X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModules, useRespondToReview } from '@/features/developerHooks';
import type { DeveloperModuleReview } from '@/types/developer';

export default function DeveloperReviewsPage() {
  const { data: modules, isLoading, error, refetch } = useDeveloperModules();
  const respondToReview = useRespondToReview();
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const moduleList = useMemo(() => {
    if (!modules) return [];
    return Array.isArray(modules) ? modules : (modules.modules || modules.data || []);
  }, [modules]);

  const allReviews: DeveloperModuleReview[] = useMemo(() => {
    const reviews: DeveloperModuleReview[] = [];
    moduleList.forEach((mod: any) => {
      if (mod.reviews && Array.isArray(mod.reviews)) {
        mod.reviews.forEach((r: DeveloperModuleReview) => {
          reviews.push({ ...r, module: mod });
        });
      }
    });
    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [moduleList]);

  const summary = useMemo(() => {
    if (allReviews.length === 0) return { averageRating: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    const total = allReviews.reduce((s, r) => s + r.rating, 0);
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      const key = Math.round(r.rating) as keyof typeof breakdown;
      if (key >= 1 && key <= 5) breakdown[key]++;
    });
    return {
      averageRating: total / allReviews.length,
      total: allReviews.length,
      breakdown,
    };
  }, [allReviews]);

  const handleRespond = async (reviewId: string) => {
    try {
      const text = replyText[reviewId];
      if (!text?.trim()) return;
      await respondToReview.mutateAsync({ reviewId, response: text });
      setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
      setExpandedReview(null);
    } catch (e) { console.error(e); }
  };

  const renderStars = (rating: number, size: string = 'h-4 w-4') => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(size, i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-600')}
      />
    ));
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'U';
  };

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des avis..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Avis & Notes"
        description="Consultez et répondez aux avis de vos clients"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Avis' },
        ]}
      />

      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          <div className="flex flex-col justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Note moyenne</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {summary.averageRating.toFixed(1)}
              </span>
              <div className="flex items-center gap-0.5">
                {renderStars(Math.round(summary.averageRating), 'h-5 w-5')}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {summary.total} avis{summary.total > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary.breakdown[star];
              const maxVal = Math.max(...Object.values(summary.breakdown), 1);
              const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-6 text-right">{star}</span>
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card>
        {allReviews.length === 0 ? (
          <EmptyState
            icon={<Star className="h-10 w-10" />}
            title="Aucun avis"
            description="Les avis de vos clients apparaîtront ici."
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {allReviews.map((review) => (
              <div key={review.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center shrink-0">
                      {review.user?.avatar ? (
                        <Image src={review.user.avatar ?? ''} alt="" fill className="rounded-full object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                      ) : (
                        <span className="text-sm font-semibold text-brand">
                          {getUserInitials(review.user?.firstName, review.user?.lastName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {review.user?.firstName} {review.user?.lastName || 'Utilisateur'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">{renderStars(review.rating, 'h-3.5 w-3.5')}</div>
                        <span className="text-xs text-gray-400">·</span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {review.module?.name && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand">
                    {review.module.name}
                  </span>
                )}

                {review.title && (
                  <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{review.title}</p>
                )}
                {review.comment && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                )}

                {review.response && (
                  <div className="mt-3 p-3.5 rounded-xl bg-brand-50/50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-brand mb-1.5">
                      <Reply className="h-3 w-3" />
                      Votre réponse
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{review.response}</p>
                    {review.responseAt && (
                      <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.responseAt).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                )}

                {!review.response && (
                  <div className="mt-3">
                    <button
                      onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-700 transition-colors"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      Répondre
                      {expandedReview === review.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {expandedReview === review.id && (
                      <div className="mt-3 space-y-3">
                        <textarea
                          value={replyText[review.id] || ''}
                          onChange={(e) => setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 resize-none"
                          placeholder="Écrivez votre réponse..."
                        />
                        <Button
                          size="sm"
                          onClick={() => handleRespond(review.id)}
                          isLoading={respondToReview.isPending}
                          disabled={!replyText[review.id]?.trim()}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Envoyer la réponse
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
