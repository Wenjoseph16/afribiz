'use client';

import { motion } from 'framer-motion';
import { Check, Lock, Sparkles } from 'lucide-react';
import { BUSINESS_MODULES, BUSINESS_TYPE_LABELS } from '@/constants/business';
import type { ModuleDef } from '@/constants/business';
import type { OnboardingData, BusinessModule } from '@/types/business';
import { cn } from '@/lib/utils';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
  pink: 'bg-pink-50 text-pink-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  rose: 'bg-rose-50 text-rose-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  lime: 'bg-lime-50 text-lime-600',
  teal: 'bg-teal-50 text-teal-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-50 text-slate-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  stone: 'bg-stone-50 text-stone-600',
  sky: 'bg-sky-50 text-sky-600',
  gray: 'bg-gray-50 text-gray-600',
};

function ModuleCard({
  mod,
  selected,
  disabled,
  onToggle,
}: {
  mod: ModuleDef;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const Icon = mod.icon;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
        disabled && 'cursor-not-allowed opacity-90',
        selected
          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60'
      )}
    >
      <span
        className={cn(
          'p-2 rounded-lg shrink-0 transition-colors',
          selected
            ? colorMap[mod.color] || 'bg-emerald-50 text-emerald-600'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-sm font-semibold',
              selected
                ? 'text-emerald-900 dark:text-emerald-200'
                : 'text-gray-900 dark:text-gray-100'
            )}
          >
            {mod.label}
          </span>
          {disabled && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase tracking-wide">
              <Lock className="h-2.5 w-2.5" /> Inclus
            </span>
          )}
        </span>
        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
          {mod.description}
        </span>
      </span>
      <span
        className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
          selected
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-gray-300 dark:border-gray-600 text-transparent'
        )}
      >
        <Check className="h-3 w-3" />
      </span>
    </button>
  );
}

export function StepModules({ data, onChange }: Props) {
  const selected = data.modules as BusinessModule[];
  const isPromotionsIncluded = selected.includes('PROMOTIONS');

  const toggle = (key: BusinessModule) => {
    if (key === 'PROMOTIONS') return;
    onChange({
      modules: selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    });
  };

  const typeLabel = BUSINESS_TYPE_LABELS[data.type];

  return (
    <div className="space-y-7">
      {/* Intro */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          Activez les fonctionnalités de votre business
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choisissez librement — aucune suggestion automatique. Vous pourrez activer ou
          désactiver des modules à tout moment depuis votre tableau de bord.
        </p>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {BUSINESS_MODULES.map((mod) => (
          <ModuleCard
            key={mod.key}
            mod={mod}
            selected={selected.includes(mod.key as BusinessModule)}
            disabled={mod.key === 'PROMOTIONS'}
            onToggle={() => toggle(mod.key as BusinessModule)}
          />
        ))}
      </div>

      {/* Récapitulatif intégré */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Récapitulatif de votre business
          </p>
          <span
            className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full',
              selected.length > 0
                ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300'
            )}
          >
            {selected.length} module{selected.length > 1 ? 's' : ''} actif
            {selected.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="px-4 py-3.5 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Business</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {data.name || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Type</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {typeLabel || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Adresse</span>
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[55%]">
              {data.address || data.city || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400">Téléphone</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{data.phone || '—'}</span>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              {BUSINESS_MODULES.filter((m) => selected.includes(m.key as BusinessModule)).map(
                (m) => (
                  <motion.span
                    key={m.key}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {m.label}
                  </motion.span>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {!isPromotionsIncluded && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Le module Promotions est toujours inclus pour vous aider à lancer votre première offre.
        </p>
      )}
    </div>
  );
}