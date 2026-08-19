'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { BUSINESS_CATEGORIES, BUSINESS_TYPE_LABELS, BUSINESS_TYPE_ICONS } from '@/constants/business';
import { Input } from '@/components/ui/Input';
import { DragDropUpload } from '@/components/onboarding/DragDropUpload';
import { cn } from '@/lib/utils';
import type { OnboardingData } from '@/types/business';

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function StepIdentity({ data, onChange }: Props) {
  const liveSlug = data.name ? slugify(data.name) : '';

  return (
    <div className="space-y-8">
      {/* Nom + slug live */}
      <div>
        <Input
          label="Nom de votre business *"
          placeholder="Ex : Chez Alice Resto"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <div
          className={cn(
            'mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all',
            liveSlug
              ? 'bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'
          )}
        >
          <span className="text-gray-400">afribiz.app/</span>
          <span className="font-medium">{liveSlug || 'votre-slug'}</span>
          <span className="flex items-center gap-0.5 text-emerald-500">
            <Check className="h-3 w-3" />
            en direct
          </span>
        </div>
      </div>

      {/* Type */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quel type d'activité ? <span className="text-red-500">*</span>
        </p>
        <div className="max-h-[340px] overflow-y-auto pr-1 space-y-4">
          {BUSINESS_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {cat.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.types.map((type) => {
                  const Icon = BUSINESS_TYPE_ICONS[type];
                  const selected = data.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onChange({ type: type as any })}
                      className={cn(
                        'relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all',
                        selected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      )}
                    >
                      <span
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          selected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                      </span>
                      <span
                        className={cn(
                          'font-medium text-sm',
                          selected
                            ? 'text-emerald-800 dark:text-emerald-200'
                            : 'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {BUSINESS_TYPE_LABELS[type]}
                      </span>
                      {selected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center"
                        >
                          <Check className="h-2.5 w-2.5" />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logo + Cover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <DragDropUpload
          label="Logo"
          value={data.logo || ''}
          onChange={(v) => onChange({ logo: v as string })}
          aspect="square"
          hint="Format carré, fond transparent de préférence."
          uploadingLabel="Chargement du logo..."
        />
        <DragDropUpload
          label="Bannière de couverture"
          value={data.coverImage || ''}
          onChange={(v) => onChange({ coverImage: v as string })}
          aspect="wide"
          hint="Grande image, 16:7 — elle habille le haut de votre page."
          uploadingLabel="Chargement de la bannière..."
        />
      </div>
    </div>
  );
}