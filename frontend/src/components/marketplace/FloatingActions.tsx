'use client';

import { useRouter } from 'next/navigation';
import { Filter, Heart, History } from 'lucide-react';

interface FloatingActionsProps {
  comparisonCount: number;
  onCompareClick: () => void;
  onFilterClick: () => void;
}

export default function FloatingActions({
  comparisonCount,
  onCompareClick,
  onFilterClick,
}: FloatingActionsProps) {
  const router = useRouter();

  return (
    <>
      {/* Compare FAB */}
      {comparisonCount > 0 && (
        <div className="fixed bottom-36 right-6 z-40">
          <button
            onClick={onCompareClick}
            className="w-14 h-14 rounded-full bg-brand text-white shadow-lg shadow-brand/30 hover:bg-brand-700 transition-all flex items-center justify-center relative"
            title="Comparer"
          >
            <span className="text-lg">{'\u21D4'}</span>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {comparisonCount}
            </span>
          </button>
        </div>
      )}

      {/* FABs */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40">
        <button onClick={onFilterClick} className="lg:hidden w-12 h-12 rounded-full bg-brand text-white shadow-lg shadow-brand/30 hover:bg-brand-700 transition-all flex items-center justify-center">
          <Filter className="h-5 w-5" />
        </button>
        <button onClick={() => router.push('/dashboard/favorites')} className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center">
          <Heart className="h-5 w-5" />
        </button>
        <button onClick={() => router.push('/dashboard/explore')} className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center">
          <History className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}
