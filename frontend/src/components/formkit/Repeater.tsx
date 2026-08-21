'use client';

import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface RepeaterProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode;
  makeNew: () => T;
  addLabel?: string;
  itemClassName?: string;
  maxItems?: number;
  disabled?: boolean;
}

/**
 * FormKit — Repeater
 * Listes dynamiques (variantes, billets, bénéfices, lignes de devis…).
 * Ajouter / modifier / supprimer des lignes sans code dupliqué.
 */
export function Repeater<T>({
  items,
  onChange,
  renderItem,
  makeNew,
  addLabel = 'Ajouter une ligne',
  itemClassName,
  maxItems,
  disabled,
}: RepeaterProps<T>) {
  const canAdd = !maxItems || items.length < maxItems;

  const update = (index: number, patch: Partial<T>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            'relative rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4',
            itemClassName
          )}
        >
          {renderItem(item, i, (patch) => update(i, patch))}
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled || items.length <= 1}
            aria-label="Supprimer cette ligne"
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, makeNew()])}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
