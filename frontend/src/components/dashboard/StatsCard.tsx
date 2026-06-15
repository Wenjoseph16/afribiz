'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

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

export function StatsCard({ icon, iconColor, iconBg, label, value, trend, className, onClick }: StatsCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-left w-full overflow-hidden',
        'hover:border-brand/20 dark:hover:border-brand/30 hover:shadow-card-hover dark:hover:shadow-lg dark:hover:shadow-brand/5',
        'transition-all duration-300 card-hover',
        className
      )}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-brand/40 via-brand to-brand/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start justify-between">
        <div className={cn(
          'p-2.5 rounded-xl group-hover:scale-105 transition-transform duration-200',
          iconBg || 'bg-brand-50 dark:bg-brand-900/30',
          iconColor || 'text-brand dark:text-brand-400'
        )}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
              trend.positive
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            )}
          >
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-3 tracking-tight">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>

      {onClick && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ArrowUpRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
        </div>
      )}
    </button>
  );
}
