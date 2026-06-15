'use client';

import Link from 'next/link';
import {
  MessageCircle, Star, ShoppingBag, Clock, AlertTriangle,
  CheckCircle2, ArrowRight, Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Action {
  id: string;
  type: 'message' | 'review' | 'order' | 'booking' | 'stock' | 'promotion' | 'setup';
  label: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  link: string;
  completed?: boolean;
}

interface DailyActionsProps {
  actions: Action[];
  onDismiss?: (id: string) => void;
}

const ACTION_ICONS = {
  message: MessageCircle,
  review: Star,
  order: ShoppingBag,
  booking: Clock,
  stock: AlertTriangle,
  promotion: Sparkles,
  setup: Sparkles,
};

const ACTION_COLORS = {
  message: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  review: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  order: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  booking: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  stock: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  promotion: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  setup: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
};

const PRIORITY_BORDER = {
  high: 'border-l-red-400 dark:border-l-red-600',
  medium: 'border-l-amber-400 dark:border-l-amber-600',
  low: 'border-l-gray-300 dark:border-l-gray-600',
};

export default function DailyActions({ actions, onDismiss }: DailyActionsProps) {
  const activeActions = actions.filter((a) => !a.completed);
  if (activeActions.length === 0) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-3 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Tout est en ordre !</p>
            <p className="text-xs text-gray-500">Aucune action urgente pour le moment.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" title="À faire aujourd'hui" titleIcon={<Clock className="h-5 w-5" />}>
      <div className="space-y-2">
        {activeActions.slice(0, 8).map((action) => {
          const Icon = ACTION_ICONS[action.type] || Sparkles;
          return (
            <Link key={action.id} href={action.link} className="block">
              <div className={cn(
                'flex items-start gap-3 p-3 rounded-xl border-l-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors',
                PRIORITY_BORDER[action.priority],
              )}>
                <div className={cn('p-2 rounded-lg shrink-0', ACTION_COLORS[action.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{action.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 shrink-0 mt-2" />
              </div>
            </Link>
          );
        })}
      </div>
      {actions.length > 8 && (
        <p className="text-xs text-gray-400 text-center mt-3">+{actions.length - 8} autres actions</p>
      )}
    </Card>
  );
}
