'use client';

import { useState } from 'react';
import { X, Info, Check } from 'lucide-react';
import { BUSINESS_MODULES } from '@/constants/business';
import type { ModuleDef } from '@/constants/business';
import type { BusinessModule } from '@/types/business';
import { cn } from '@/lib/utils';

interface Props {
  selected: BusinessModule[];
  onChange: (modules: BusinessModule[]) => void;
}

export function StepModules({ selected, onChange }: Props) {
  const [detail, setDetail] = useState<ModuleDef | null>(null);

  const toggle = (key: BusinessModule) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activez vos modules</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choisissez les fonctionnalités que vous souhaitez activer pour votre business.
          Vous pourrez les modifier plus tard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BUSINESS_MODULES.map(mod => {
          const isSelected = selected.includes(mod.key as BusinessModule);
          const Icon = mod.icon;
          const colorMap: Record<string, string> = {
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            pink: 'bg-pink-50 text-pink-600 border-pink-200',
            amber: 'bg-amber-50 text-amber-600 border-amber-200',
            red: 'bg-red-50 text-red-600 border-red-200',
            cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
            rose: 'bg-rose-50 text-rose-600 border-rose-200',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            lime: 'bg-lime-50 text-lime-600 border-lime-200',
            teal: 'bg-teal-50 text-teal-600 border-teal-200',
            violet: 'bg-violet-50 text-violet-600 border-violet-200',
            slate: 'bg-slate-50 text-slate-600 border-slate-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            stone: 'bg-stone-50 text-stone-600 border-stone-200',
            sky: 'bg-sky-50 text-sky-600 border-sky-200',
            gray: 'bg-gray-50 text-gray-600 border-gray-200',
          };
          const activeColor = colorMap[mod.color] || 'bg-gray-50 text-gray-600';

          return (
            <button
              key={mod.key}
              type="button"
              onClick={() => toggle(mod.key as BusinessModule)}
              className={cn(
                'relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                isSelected
                  ? 'border-brand bg-brand/5 ring-1 ring-brand/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
            >
              <div className={cn('p-2 rounded-lg border', isSelected ? activeColor : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700')}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{mod.label}</p>
                  {isSelected && <Check className="h-4 w-4 text-brand shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{mod.description}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDetail(mod); }}
                className="shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Info className="h-4 w-4" />
              </button>
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {selected.length === 0
          ? 'Aucun module sélectionné'
          : `${selected.length} module${selected.length > 1 ? 's' : ''} sélectionné${selected.length > 1 ? 's' : ''}`
        }
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDetail(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setDetail(null)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-brand/10 text-brand">
                <detail.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{detail.label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{detail.key}</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{detail.description}</p>
            <button
              onClick={() => {
                toggle(detail.key as BusinessModule);
                setDetail(null);
              }}
              className={cn(
                'mt-5 w-full py-2.5 rounded-lg font-medium text-sm transition-all',
                selected.includes(detail.key as BusinessModule)
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-brand text-white hover:bg-brand-700',
              )}
            >
              {selected.includes(detail.key as BusinessModule)
                ? 'Désactiver ce module'
                : 'Activer ce module'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
