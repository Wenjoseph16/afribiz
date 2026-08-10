'use client';

import Link from 'next/link';
import { Radio, CalendarClock } from 'lucide-react';
import { useActiveLives } from '@/hooks/features/useLives';
import { LiveCard } from '@/components/media/LiveCard';

export default function LivesPage() {
  const { data: livesData } = useActiveLives();
  const lives = livesData?.items || [];
  const liveNow = lives.filter((l: any) => l.status === 'LIVE');
  const scheduled = lives.filter((l: any) => l.status !== 'LIVE');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/30">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Lives en direct</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Regardez les commerces en direct et achetez pendant le live.
          </p>
        </div>
      </div>

      {/* Lives en cours */}
      {liveNow.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">En ce moment</h2>
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
              {liveNow.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {liveNow.map((live: any) => (
              <LiveCard key={live.id} live={live} />
            ))}
          </div>
        </section>
      )}

      {/* Lives programmés */}
      {scheduled.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">À venir</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {scheduled.map((live: any) => (
              <LiveCard key={live.id} live={live} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {lives.length === 0 && (
        <div className="text-center py-20">
          <Radio className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Aucun live pour le moment
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            Les commerces lanceront bientôt leurs directs. Revenez plus tard !
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all"
          >
            Découvrir le marketplace
          </Link>
        </div>
      )}
    </div>
  );
}
