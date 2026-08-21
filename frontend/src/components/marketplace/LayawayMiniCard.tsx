'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Lock, PiggyBank, ShieldCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

/**
 * Mini carte « Épargne Achat » intégrée à la fiche produit (et réutilisable sur
 * n'importe quelle fiche article du catalogue : produit, service, chambre…).
 *
 * - Public : charge l'offre épargne active de l'article (1 appel, léger).
 * - Si l'utilisateur est connecté : détecte son plan en cours sur CETTE offre
 *   pour afficher la progression au lieu d'un simple bouton « Épargner ».
 * - Sécurité affichée : escrow + remboursement intégral (argument de confiance).
 */
export function LayawayMiniCard({
  itemType = 'PRODUCT',
  itemId,
  targetPrice,
  currency = 'FCFA',
  className,
}: {
  itemType?: string;
  itemId: string;
  targetPrice: number;
  currency?: string;
  className?: string;
}) {
  const router = useRouter();
  // NB: le store zustand est skipHydration:true et ne se réhydrate que dans AuthGuard
  // (routes dashboard). Sur les pages publiques (fiche produit), on lit donc le token
  // directement depuis localStorage (pattern identique à la vitrine business).
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  const { data: offer, isLoading: offerLoading } = useQuery({
    queryKey: ['layaway-active-offer', itemType, itemId],
    queryFn: async () => {
      const res = await apiClient.getActiveLayawayOffer(itemType, itemId);
      return res.data.data as any; // null si l'épargne n'est pas active sur cet article
    },
    enabled: !!itemId,
    staleTime: 60_000,
  });

  const { data: myPlans } = useQuery({
    queryKey: ['my-layaway-plans-for-offer', offer?.id],
    queryFn: async () => {
      const res = await apiClient.getMyLayawayPlans();
      return (res.data.data?.plans || []) as any[];
    },
    enabled: hasToken && !!offer?.id,
    staleTime: 30_000,
  });

  const existingPlan = useMemo(() => {
    if (!myPlans || !offer) return null;
    return (
      myPlans.find((p: any) => p.offerId === offer.id && ['ACTIVE', 'READY'].includes(p.status)) ||
      null
    );
  }, [myPlans, offer]);

  if (offerLoading) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-emerald-200/60 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 animate-pulse',
          className
        )}
      >
        <div className="h-4 w-32 bg-emerald-200/60 dark:bg-emerald-800/40 rounded" />
        <div className="h-8 w-48 bg-emerald-200/60 dark:bg-emerald-800/40 rounded mt-3" />
      </div>
    );
  }

  // Pas d'offre épargne active → la carte ne s'affiche pas
  if (!offer) return null;

  const price = Number(targetPrice || 0);
  const minInstallment = Number(offer.minInstallment || 0);
  const duration = Number(offer.durationDays || 90);
  const planTarget = Number(existingPlan?.targetAmount || price || 1);
  const planSaved = Number(existingPlan?.savedAmount || 0);
  const progress = Math.min(100, Math.round((planSaved / Math.max(1, planTarget)) * 100));

  const handleStart = async () => {
    if (!hasToken) {
      router.push('/login?redirect=/dashboard/my-layaway');
      return;
    }
    setStarting(true);
    setError('');
    try {
      await apiClient.createLayawayPlan(offer.id);
      setStarting(false);
      router.push('/dashboard/my-layaway');
    } catch (err: any) {
      setStarting(false);
      if (err?.response?.status === 409) {
        // Plan déjà actif → on y va quand même
        router.push('/dashboard/my-layaway');
        return;
      }
      // Erreur réelle (500 / réseau) : on reste sur la page avec un message clair
      setError(
        err?.response?.data?.message ||
          'Impossible de créer le plan épargne pour le moment. Réessayez dans un instant.'
      );
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60',
        'bg-gradient-to-br from-emerald-50 via-white to-teal-50/70 dark:from-emerald-950/40 dark:via-gray-900 dark:to-teal-950/30',
        'p-4 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* halo décoratif */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-200/30 dark:bg-emerald-500/10 blur-2xl" />

      <div className="relative">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <PiggyBank className="w-4 h-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                Épargne Achat disponible
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Sécurisé en escrow
              </p>
            </div>
          </div>
          {existingPlan ? (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/60">
              En cours · {progress}%
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/70 dark:bg-gray-800/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/60">
              Sans frais
            </span>
          )}
        </div>

        {/* Prix cible + conditions */}
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Prix cible</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              {formatCurrency(price, currency)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right">
            <div className="rounded-xl bg-white/70 dark:bg-gray-800/60 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-1.5">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Dès</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(minInstallment, currency)}
                <span className="font-medium text-gray-500 dark:text-gray-400"> / cotisation</span>
              </p>
            </div>
            <div className="rounded-xl bg-white/70 dark:bg-gray-800/60 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-1.5">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Durée</p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {duration} j
                <span className="font-medium text-gray-500 dark:text-gray-400"> max</span>
              </p>
            </div>
          </div>
        </div>

        {/* Progression si un plan est déjà en cours */}
        {existingPlan && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
              {formatCurrency(planSaved, currency)} épargnés sur{' '}
              {formatCurrency(planTarget, currency)}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-lg px-2.5 py-1.5">
            {error}
          </p>
        )}

        {/* Action */}
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
            existingPlan
              ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-500/70 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.99]',
            starting && 'opacity-60 cursor-wait'
          )}
          title="Créez votre plan épargne — votre argent reste en escrow jusqu'à l'achat"
        >
          {starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Création du plan…
            </>
          ) : existingPlan ? (
            <>
              Voir mon épargne <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" /> Épargner ce produit
            </>
          )}
        </button>

        {/* Réassurance */}
        <p className="mt-2.5 text-[11px] text-gray-500 dark:text-gray-400 text-center leading-snug">
          Payez progressivement, achetez quand vous êtes prêt. Votre argent est{' '}
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            gardé en escrow
          </span>{' '}
          — remboursé à 100% si vous changez d'avis.
        </p>
      </div>
    </div>
  );
}
