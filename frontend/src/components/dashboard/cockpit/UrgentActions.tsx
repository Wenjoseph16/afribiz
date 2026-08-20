'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  Truck,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UrgentAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'red' | 'amber' | 'blue' | 'emerald';
  href: string;
}

interface UrgentActionsProps {
  actions: UrgentAction[];
}

const colorMap = {
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-100',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-100',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-100',
  },
};

export function UrgentActions({ actions }: UrgentActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3 px-1">
        Actions urgentes
      </p>
      <div className="space-y-2">
        {actions.map((action) => {
          const colors = colorMap[action.color];
          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                'hover:shadow-sm active:scale-[0.99]',
                colors.bg,
                colors.border
              )}
            >
              <span className={cn('p-2 rounded-lg', colors.bg, colors.text)}>
                {action.icon}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                {action.label}
              </span>
              <span
                className={cn(
                  'text-xs font-bold px-2.5 py-1 rounded-full tabular-nums',
                  colors.badge
                )}
              >
                {action.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
