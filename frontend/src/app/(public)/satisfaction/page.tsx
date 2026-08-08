'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Sparkles,
  Heart,
  MessageSquareHeart,
  ArrowLeft,
  CheckCircle2,
  Store,
  Package,
  Lock,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const STAR_LABELS = [
  '',
  'Décevant',
  'Moyen',
  'Bien',
  'Très bien',
  'Excellent ✨',
];

function SatisfactionInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || undefined;
  const bookingId = searchParams.get('bookingId') || undefined;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(!!(orderId || bookingId));
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirect = orderId
    ? `/satisfaction?orderId=${orderId}`
    : bookingId
    ? `/satisfaction?bookingId=${bookingId}`
    : '/satisfaction';

  // Contexte de la commande / réservation (pour savoir ce qu'on évalue)
  useEffect(() => {
    if (!isAuthenticated || !(orderId || bookingId)) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .getSatisfactionContext({ orderId, bookingId })
      .then((res: any) => {
        if (!cancelled) setContext(res.data?.data || null);
      })
      .catch(() => {
        // Le contexte est optionnel : on affiche quand même l'enquête
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, orderId, bookingId]);

  const handleSubmit = useCallback(async () => {
    if (score < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.submitSatisfaction({ orderId, bookingId, score, feedback });
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Impossible d'envoyer votre avis. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }, [score, feedback, orderId, bookingId]);

  // ── Non connecté → invitation à se connecter ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f6f8f7]">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white bg-white/90 p-10 text-center shadow-[0_20px_60px_-20px_rgba(16,40,33,0.25)] backdrop-blur"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Votre avis compte
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Connectez-vous pour noter votre expérience en moins d'une minute.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 hover:shadow-lg"
            >
              Se connecter
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Merci (état final) ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f6f8f7]">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white bg-white/90 p-10 text-center shadow-[0_20px_60px_-20px_rgba(16,40,33,0.25)] backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </motion.div>
            <div className="mb-4 flex justify-center gap-1">
              {Array.from({ length: score }).map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Merci pour votre avis ! 🎉
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Votre retour aide {context?.businessName || 'ce commerce'} à s'améliorer et les
              prochains clients à choisir en confiance.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              {orderId && (
                <Link
                  href={`/dashboard/orders/${orderId}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Suivre ma commande
                </Link>
              )}
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Retour à l'accueil
              </Link>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Formulaire ──
  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-white bg-white/90 shadow-[0_24px_70px_-24px_rgba(16,40,33,0.3)] backdrop-blur"
        >
          {/* En-tête dégradé */}
          <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-8 py-10 text-white">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
            >
              <MessageSquareHeart className="h-7 w-7" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">Votre avis compte 💬</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-50/90">
              {context?.businessName
                ? `Comment s'est passée votre expérience chez ${context.businessName} ?`
                : 'Comment s\'est passée votre expérience ?'}
            </p>
            {context && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {context.businessName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                    <Store className="h-3.5 w-3.5" /> {context.businessName}
                  </span>
                )}
                {context.itemName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                    <Package className="h-3.5 w-3.5" /> {context.itemName}
                  </span>
                )}
                {context.reference && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                    {context.reference}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-8">
            {/* Note (étoiles) */}
            <p className="text-sm font-semibold text-slate-700">Note globale</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const n = i + 1;
                const active = (hover || score) >= n;
                return (
                  <motion.button
                    key={n}
                    whileHover={{ scale: 1.18, y: -4 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setScore(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                    className="transition"
                  >
                    <Star
                      className={`h-11 w-11 transition-colors duration-150 ${
                        active
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_4px_12px_rgba(251,191,36,0.45)]'
                          : 'text-slate-200 hover:text-amber-300'
                      }`}
                    />
                  </motion.button>
                );
              })}
            </div>
            <div className="mt-3 h-6 text-center">
              <AnimatePresence mode="wait">
                {(hover || score) > 0 && (
                  <motion.p
                    key={hover || score}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-semibold text-amber-600"
                  >
                    {STAR_LABELS[hover || score]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Commentaire */}
            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700" htmlFor="feedback">
                Un petit mot (optionnel)
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Ce qui vous a plu, ce qu'on peut améliorer…"
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <motion.button
              whileHover={{ scale: score > 0 && !submitting ? 1.02 : 1 }}
              whileTap={{ scale: score > 0 && !submitting ? 0.98 : 1 }}
              onClick={handleSubmit}
              disabled={score < 1 || submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition enabled:hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Envoi…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Envoyer mon avis
                </>
              )}
            </motion.button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              Moins d'une minute — vos réponses restent anonymes pour le commerce.
            </p>
          </div>
        </motion.div>

        {loading && (
          <p className="mt-6 text-center text-xs text-slate-400">Chargement du contexte…</p>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function SatisfactionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f6f8f7]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-600" />
        </div>
      }
    >
      <SatisfactionInner />
    </Suspense>
  );
}
