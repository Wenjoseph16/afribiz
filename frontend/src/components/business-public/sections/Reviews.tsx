'use client';

import Image from 'next/image';
import { BusinessReview } from '@/types/business';
import { Star } from 'lucide-react';

interface ReviewsProps {
  reviews: BusinessReview[];
}

export function Reviews({ reviews }: ReviewsProps) {
  if (!reviews?.length) return null;

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const distribution = Array.from({ length: 5 }, (_, i) => {
    const star = 5 - i;
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, percentage: (count / reviews.length) * 100 };
  });

  return (
    <section id="section-reviews" className="scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Avis Clients</h2>

        <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center flex-shrink-0">
            <div className="text-5xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reviews.length} avis</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right text-gray-600 dark:text-gray-300">{d.star}</span>
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${d.percentage}%` }} />
                </div>
                <span className="w-8 text-xs text-gray-400">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand font-semibold text-sm flex-shrink-0 relative overflow-hidden">
                  {review.user.avatar ? (
                    <Image src={review.user.avatar} alt="" fill className="rounded-full object-cover" />
                  ) : (
                    `${review.user.firstName.charAt(0)}${review.user.lastName.charAt(0)}`
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {review.user.firstName} {review.user.lastName}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                  </div>
                </div>
              </div>
              {review.title && <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{review.title}</h4>}
              {review.comment && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-4">{review.comment}</p>}
              {(review.images?.length ?? 0) > 0 && (
                <div className="flex gap-2 mt-3">
                  {(review.images ?? []).slice(0, 3).map((img, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                      <Image src={img} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {review.response && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-2 border-brand">
                  <p className="text-xs font-medium text-brand mb-1">Réponse du business</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{review.response}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
