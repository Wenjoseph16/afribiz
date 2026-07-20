'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface SocialStat {
  label: string;
  value: number;
  icon: React.ReactNode;
  suffix?: string;
  prefix?: string;
  trend?: 'up' | 'down' | 'neutral';
  pulse?: boolean;
}

export function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {count}
    </span>
  );
}

export function SocialStatsRow({ stats, className }: { stats: SocialStat[]; className?: string }) {
  if (!stats || stats.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50',
            stat.pulse && 'animate-pulse'
          )}
        >
          <span className="text-gray-400 dark:text-gray-500">{stat.icon}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
            {stat.prefix && <span className="text-xs text-gray-400">{stat.prefix}</span>}
            <AnimatedCounter value={stat.value} duration={2000 + i * 200} />
            {stat.suffix && <span className="text-xs text-gray-400 ml-0.5">{stat.suffix}</span>}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
            {stat.label}
          </span>
          {stat.trend && (
            <TrendingUp
              className={cn(
                'w-3 h-3',
                stat.trend === 'up' && 'text-green-500',
                stat.trend === 'down' && 'text-red-500 rotate-180',
                stat.trend === 'neutral' && 'text-gray-400'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// LiveSocialProof supprimé — remplacé par LiveVisitorCounter plus performant dans Banner.tsx
