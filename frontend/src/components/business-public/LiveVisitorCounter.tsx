'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from './SocialStats';

interface LiveVisitorCounterProps {
  slug: string;
  variant?: 'banner' | 'inline' | 'badge';
  className?: string;
}

interface LiveData {
  visitorsToday: number;
  ordersToday: number;
  bookingsWeek: number;
  activeClients: number;
}

export function LiveVisitorCounter({
  slug,
  variant = 'inline',
  className,
}: LiveVisitorCounterProps) {
  const [data, setData] = useState<LiveData | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/business/${slug}/stats/live`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
          }
        }
      } catch {
        // Silently fail
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [slug]);

  if (!data) return null;

  // Banner variant: shown in the hero area
  if (variant === 'banner') {
    return (
      <div className={cn('flex items-center gap-3 flex-wrap', className)}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-green-400" />
          </span>
          <span className="text-xs font-medium text-white/90">
            <AnimatedCounter value={data.visitorsToday} duration={1000} /> visiteur
            {data.visitorsToday > 1 ? 's' : ''} aujourd'hui
          </span>
        </div>
        {data.activeClients > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
            <Users className="w-3 h-3 text-white/80" />
            <span className="text-xs font-medium text-white/90">
              <AnimatedCounter value={data.activeClients} duration={1000} /> en ligne
            </span>
          </div>
        )}
        {data.ordersToday > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
            <TrendingUp className="w-3 h-3 text-white/80" />
            <span className="text-xs font-medium text-white/90">
              <AnimatedCounter value={data.ordersToday} duration={1000} /> commande
              {data.ordersToday > 1 ? 's' : ''} aujourd'hui
            </span>
          </div>
        )}
      </div>
    );
  }

  // Badge variant: small pill shown next to rating
  if (variant === 'badge') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100/90 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
          className
        )}
      >
        <span className="relative flex w-1.5 h-1.5">
          <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-green-500" />
        </span>
        <AnimatedCounter value={data.visitorsToday} duration={1000} /> visiteur
        {data.visitorsToday > 1 ? 's' : ''} aujourd'hui
      </div>
    );
  }

  // Inline variant: detailed stats row (default)
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
        </span>
        <span className="text-xs font-semibold text-green-700 dark:text-green-300">
          <AnimatedCounter value={data.visitorsToday} duration={1000} />
        </span>
        <span className="text-[10px] text-green-600 dark:text-green-400">
          visiteurs aujourd'hui
        </span>
      </div>
      {data.ordersToday > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <TrendingUp className="w-3 h-3 text-blue-500" />
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            <AnimatedCounter value={data.ordersToday} duration={1000} />
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400">ventes</span>
        </div>
      )}
      {data.activeClients > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <Users className="w-3 h-3 text-purple-500" />
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
            <AnimatedCounter value={data.activeClients} duration={1000} />
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400">en ligne</span>
        </div>
      )}
      {data.bookingsWeek > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Activity className="w-3 h-3 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            <AnimatedCounter value={data.bookingsWeek} duration={1000} />
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            réservations cette semaine
          </span>
        </div>
      )}
    </div>
  );
}
