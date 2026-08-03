'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useCreateReview } from '@/features/hooks/reviews';

interface ReviewFormProps {
  productId?: string;
  serviceId?: string;
  title?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  productId,
  serviceId,
  title = 'Laisser un avis',
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview();

  const targetReady = Boolean(productId || serviceId);

  const handleSubmit = async () => {
    if (!targetReady) return;
    const formData = new FormData();
    if (productId) formData.append('productId', productId);
    if (serviceId) formData.append('serviceId', serviceId);
    formData.append('rating', String(rating));
    formData.append('comment', comment);
    try {
      await createReview.mutateAsync(formData);
      onSuccess?.();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        alert('Vous avez déjà évalué ce contenu.');
      } else {
        alert("Erreur lors de la publication de l'avis");
      }
    }
  };

  if (!targetReady) {
    return <p className="text-sm text-gray-500">Cet élément ne peut pas encore être évalué.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(value)}
              className="transition-transform hover:scale-110"
              aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  'h-5 w-5',
                  value <= (hover || rating) ? 'text-amber-400 fill-current' : 'text-gray-300'
                )}
              />
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Partagez votre expérience (optionnel)"
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
      />

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSubmit} isLoading={createReview.isPending}>
          Publier l&apos;avis
        </Button>
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </div>
  );
}
