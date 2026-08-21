'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

/**
 * Bouton « 🔒 Épargner » pour les cards du marketplace.
 * - Si non connecté → redirige vers /login puis « Mes épargnes ».
 * - Si connecté → crée le plan épargne (ou ignore le 409 « déjà actif ») puis
 *   redirige vers /dashboard/my-layaway.
 */
export function LayawayCardButton({
  offerId,
  className,
  size = 'sm',
}: {
  offerId: string;
  className?: string;
  size?: 'sm' | 'xs';
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  // Pages publiques (marketplace) : le store zustand (skipHydration) n'est pas
  // hydraté — on lit le token directement depuis localStorage (pattern vitrine).
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasToken) {
      router.push('/login?redirect=/dashboard/my-layaway');
      return;
    }
    setStarting(true);
    try {
      await apiClient.createLayawayPlan(offerId);
      setStarting(false);
      router.push('/dashboard/my-layaway');
    } catch (err: any) {
      setStarting(false);
      if (err?.response?.status === 409) {
        // Plan déjà actif → on y va quand même
        router.push('/dashboard/my-layaway');
      }
      // Erreur réelle : on reste sur la page (le bouton se réarme)
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={starting}
      title="Épargnez progressivement et achetez quand vous êtes prêt — argent sécurisé en escrow"
      className={cn(
        'font-medium rounded-lg inline-flex items-center justify-center gap-1 transition-all',
        size === 'sm' ? 'text-xs px-2.5 py-2' : 'text-[11px] px-2 py-1.5',
        'border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
        starting && 'opacity-60 cursor-wait',
        className
      )}
    >
      {starting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
      Épargner
    </button>
  );
}

/** Badge « 🔒 Épargne dispo » à poser sur l'image de la carte. */
export function LayawayBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white text-[9px] font-bold shadow-sm',
        className
      )}
      title="Épargne disponible — payez progressivement, argent sécurisé en escrow"
    >
      <Lock className="w-2.5 h-2.5" /> Épargne
    </span>
  );
}
