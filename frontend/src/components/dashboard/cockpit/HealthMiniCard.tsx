'use client';

import Link from 'next/link';
import { Award, ChevronRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthMiniCardProps {
  afriscore: number;
  reviewCount: number;
  avgRating: number;
  verificationLevel?: string;
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}

function scoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 50) return 'Bon';
  if (score > 0) return 'À améliorer';
  return 'Nouveau';
}

export function HealthMiniCard({
  afriscore,
  reviewCount,
  avgRating,
  verificationLevel,
}: HealthMiniCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Santé du business
        </p>
        <Link
          href="/dashboard/afriscore"
          className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
        >
          Détails <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center gap-5">
        {/* Score circulaire */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#E2E8F0" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              className={scoreBg(afriscore)}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${(afriscore / 100) * 175.9} 175.9`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-lg font-bold tabular-nums', scoreColor(afriscore))}>
              {afriscore}
            </span>
          </div>
        </div>

        {/* Infos */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Statut</span>
            <span className={cn('text-xs font-semibold', scoreColor(afriscore))}>
              {scoreLabel(afriscore)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Avis</span>
            <span className="text-xs font-semibold text-slate-700 tabular-nums">
              {avgRating > 0 ? `${avgRating.toFixed(1)}★` : '—'}{' '}
              <span className="text-slate-400 font-normal">({reviewCount})</span>
            </span>
          </div>
          {verificationLevel && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Vérification</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                <Shield className="h-3 w-3" />
                {verificationLevel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
