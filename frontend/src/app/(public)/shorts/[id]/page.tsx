'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Flame } from 'lucide-react';
import { ShortsFeed } from '@/components/stories/ShortsFeed';
import { useShort } from '@/hooks/features/useShorts';

export default function ShortDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: short } = useShort(params.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/shorts"
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg shadow-brand-500/30">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {short?.title || 'Short'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{short?.business?.name}</p>
        </div>
      </div>

      {/* Player — démarre sur le short demandé */}
      <ShortsFeed initialShortId={params.id} />
    </div>
  );
}
