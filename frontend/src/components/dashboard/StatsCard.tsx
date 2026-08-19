'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  icon: ReactNode;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  className?: string;
  onClick?: () => void;
}

export function StatsCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  trend,
  className,
  onClick,
}: StatsCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative text-left w-full overflow-hidden',
        className
      )}
    >
      {/* Outer shell — double-bezel */}
      <div className="glass rounded-2xl hover:border-emerald-500/20 transition-all duration-300">
        <div className="relative rounded-[calc(1rem-0.1875rem)] bg-gradient-to-br from-white/[0.02] to-transparent p-5">
          {/* Hover glow */}
          <div className="absolute inset-0 rounded-[calc(1rem-0.1875rem)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  'p-2.5 rounded-xl group-hover:scale-105 transition-transform duration-200',
                  iconBg || 'bg-emerald-500/10',
                  iconColor || 'text-emerald-400'
                )}
              >
                {icon}
              </div>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    trend.positive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  )}
                >
                  {trend.positive ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {trend.value}
                </span>
              )}
            </div>
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-white mt-3 tracking-tight tabular-nums">
              {value}
            </p>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 font-medium">{label}</p>
          </div>
        </div>
      </div>
    </button>
  );
}
