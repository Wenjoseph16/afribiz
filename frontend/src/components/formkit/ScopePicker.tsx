'use client';

import { Building2, FolderTree, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormField } from './FormField';

export type ScopeType = 'ALL' | 'CATEGORY' | 'ITEMS';

export interface ScopeValue {
  scope: ScopeType;
  categoryIds: string[];
  itemIds: string[];
}

interface ScopeCategory {
  id: string;
  name: string;
  count?: number;
}

interface ScopeItem {
  id: string;
  name: string;
  price?: number;
  type?: string;
}

interface ScopePickerProps {
  value?: ScopeValue;
  onChange?: (value: ScopeValue) => void;
  label?: string;
  help?: string;
  categories?: ScopeCategory[];
  items?: ScopeItem[];
  itemTypeLabel?: string;
  disabled?: boolean;
}

/**
 * FormKit — ScopePicker
 * Le sélecteur de ciblage UNIQUE de la plateforme (Socle de rattachement) :
 * une promotion, une épargne, un achat groupé… se rattache à
 * TOUT · UNE CATÉGORIE · DES ARTICLES PRÉCIS — une seule logique partout.
 */
export function ScopePicker({
  value,
  onChange,
  label = 'Où appliquer ?',
  help,
  categories = [],
  items = [],
  itemTypeLabel = 'articles',
  disabled,
}: ScopePickerProps) {
  const v: ScopeValue = value || { scope: 'ALL', categoryIds: [], itemIds: [] };

  const set = (patch: Partial<ScopeValue>) => onChange?.({ ...v, ...patch });

  const scopeOptions: { value: ScopeType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: 'ALL',
      label: "Toute l'entreprise",
      desc: "S'applique à tout mon catalogue",
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      value: 'CATEGORY',
      label: 'Une catégorie',
      desc:
        categories.length > 0
          ? `${categories.length} catégorie(s) disponibles`
          : 'Choisir une catégorie',
      icon: <FolderTree className="w-4 h-4" />,
    },
    {
      value: 'ITEMS',
      label: 'Des articles précis',
      desc:
        items.length > 0
          ? `${items.length} ${itemTypeLabel} disponibles`
          : `Choisir des ${itemTypeLabel}`,
      icon: <Package className="w-4 h-4" />,
    },
  ];

  return (
    <FormField label={label} help={help}>
      {/* Choix du scope */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {scopeOptions.map((opt) => {
          const selected = v.scope === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => set({ scope: opt.value })}
              className={cn(
                'flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all',
                selected
                  ? 'border-brand bg-brand/5 ring-4 ring-brand/10'
                  : 'border-gray-100 dark:border-gray-800 hover:border-gray-200',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg',
                  selected ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                )}
              >
                {opt.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{opt.label}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                  {opt.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sélection des catégories */}
      {v.scope === 'CATEGORY' && (
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-gray-400">Aucune catégorie pour le moment.</p>
          )}
          {categories.map((cat) => {
            const active = v.categoryIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  set({
                    categoryIds: active
                      ? v.categoryIds.filter((id) => id !== cat.id)
                      : [...v.categoryIds, cat.id],
                  })
                }
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  active
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand/50'
                )}
              >
                {cat.name}
                {cat.count !== undefined && ` (${cat.count})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Sélection des articles */}
      {v.scope === 'ITEMS' && (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {items.length === 0 && (
            <p className="text-sm text-gray-400 p-3">Aucun article pour le moment.</p>
          )}
          {items.map((item) => {
            const active = v.itemIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  set({
                    itemIds: active
                      ? v.itemIds.filter((id) => id !== item.id)
                      : [...v.itemIds, item.id],
                  })
                }
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors',
                  active ? 'bg-brand/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  {item.type && <p className="text-[11px] text-gray-400">{item.type}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.price !== undefined && (
                    <span className="text-xs text-gray-500">
                      {item.price.toLocaleString('fr-FR')} F
                    </span>
                  )}
                  <span
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center',
                      active ? 'border-brand bg-brand' : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </FormField>
  );
}
