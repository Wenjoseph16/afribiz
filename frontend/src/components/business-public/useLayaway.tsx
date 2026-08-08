'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Lock } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

/**
 * Récupère en un seul appel les offres épargne actives pour une grille d'articles
 * du même type (PRODUCT, SERVICE, ROOM, RENTAL, EVENT, TRAINING).
 */
export function useLayawayOffers(itemType: string, itemIds: string[], enabled = true) {
  const ids = useMemo(() => [...new Set(itemIds.filter(Boolean))], [itemIds]);
  return useQuery({
    queryKey: ['layaway-offers', itemType, ids],
    queryFn: async () => {
      try {
        const res = await apiClient.getActiveLayawayOffers(itemType, ids);
        return res.data.data?.offers || {};
      } catch {
        return {};
      }
    },
    enabled: enabled && ids.length > 0,
    staleTime: 60_000,
  });
}

/**
 * Bouton « 🔒 Épargner » — crée un plan épargne sur l'article (redirige vers
 * /login si l'utilisateur n'est pas connecté, puis vers « Mes épargnes »).
 */
export function LayawayButton({
  offer,
  itemId,
  className,
  variant = 'outline',
}: {
  offer?: { id: string } | null;
  itemId: string;
  className?: string;
  variant?: 'outline' | 'solid';
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  if (!offer) return null;

  const handleClick = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login?redirect=/dashboard/my-layaway');
      return;
    }
    setStarting(true);
    try {
      await apiClient.createLayawayPlan(offer.id);
    } catch {
      // Plan déjà existant → on y va quand même
    } finally {
      setStarting(false);
      router.push('/dashboard/my-layaway');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={starting}
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
        variant === 'solid'
          ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
          : 'border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
        starting && 'opacity-60 cursor-wait',
        className
      )}
      title="Épargnez progressivement et achetez quand vous êtes prêt — argent sécurisé en escrow"
    >
      {starting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
      Épargner
    </button>
  );
}

/** Badge « 🔒 Épargne dispo » à poser sur l'image de la carte. */
export function LayawayBadge({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full shadow-sm flex items-center gap-0.5">
      <Lock className="w-2.5 h-2.5" /> Épargne dispo
    </span>
  );
}
