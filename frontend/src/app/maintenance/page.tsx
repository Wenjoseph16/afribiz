'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/config';

/**
 * Page 503 — Mode maintenance.
 * Affichée automatiquement quand l'API renvoie MAINTENANCE_MODE (voir apiClient).
 * Se recharge périodiquement : dès que l'API répond à nouveau, on revient sur la
 * page d'accueil.
 */
export default function MaintenancePage() {
  const [elapsed, setElapsed] = useState(0);

  // Horloge de temps écoulé + polling de sortie de maintenance
  useEffect(() => {
    const t0 = Date.now();
    const clock = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);

    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/health`, { cache: 'no-store' });
        // Le health check répond toujours 200 ; la maintenance se voit sur /api/*.
        // On vérifie le flag via un endpoint public dédié pour éviter les faux positifs.
        const flags = await fetch(`${getApiBaseUrl()}/public/maintenance-status`, {
          cache: 'no-store',
        });
        const data = await flags.json();
        if (!cancelled && data?.maintenance === false) {
          window.location.href = '/';
        }
      } catch {
        // API injoignable → toujours en maintenance
      }
    };
    const poll = setInterval(check, 15000);
    check();
    return () => {
      cancelled = true;
      clearInterval(clock);
      clearInterval(poll);
    };
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Décor */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-xl w-full text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30 animate-pulse">
          <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-white">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-300 mb-6">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          Maintenance planifiée
        </p>

        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Nous revenons dans un instant
        </h1>
        <p className="text-slate-300 text-lg leading-relaxed mb-8">
          AfriBiz subit actuellement une maintenance pour vous offrir une meilleure
          expérience. Nos équipes travaillent activement — vos données sont en sécurité.
        </p>

        <div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur">
          <svg className="h-5 w-5 text-emerald-400 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-slate-200 tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-sm text-slate-400">depuis le début de la maintenance</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12a8 8 0 0 1 14-5m3 5a8 8 0 0 1-14 5m0 0l-4-3m4 3l3-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Réessayer maintenant
          </button>
          <a
            href="mailto:support@afribiz.net"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-slate-200 transition hover:bg-white/10"
          >
            Contacter le support
          </a>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Rafraîchissement automatique toutes les 15 secondes · Merci de votre patience
        </p>
      </div>
    </div>
  );
}
