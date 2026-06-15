'use client';

import { cn } from '@/lib/utils';

export default function Badge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    verified: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    premium: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    top_seller: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    recommended: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    delivery: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    escrow: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  };
  const labels: Record<string, string> = {
    verified: 'Vérifié', premium: 'Premium', top_seller: 'Top vendeur',
    recommended: 'Recommandé', delivery: 'Livraison', escrow: 'Escrow',
  };
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border', colors[label] || 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700')}>
      {labels[label] || label}
    </span>
  );
}
