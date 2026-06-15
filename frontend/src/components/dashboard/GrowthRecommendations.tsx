'use client';

import Link from 'next/link';
import {
  Lightbulb, TrendingUp, Users, Star, ShoppingBag,
  Megaphone, Camera, MessageCircle, ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Recommendation {
  id: string;
  category: 'marketing' | 'products' | 'service' | 'finance' | 'growth';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  link: string;
}

const CATEGORY_STYLES: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  marketing: { icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', label: 'Marketing' },
  products: { icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Produits' },
  service: { icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Service' },
  finance: { icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Finance' },
  growth: { icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', label: 'Croissance' },
};

export default function GrowthRecommendations({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) return null;

  const sorted = [...recommendations].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.impact] - rank[b.impact];
  });

  return (
    <Card padding="lg" title="Recommandations pour grandir" titleIcon={<Lightbulb className="h-5 w-5" />}>
      <div className="space-y-3">
        {sorted.slice(0, 5).map((rec) => {
          const cat = CATEGORY_STYLES[rec.category] || CATEGORY_STYLES.growth;
          const Icon = cat.icon;
          return (
            <div key={rec.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-brand/20 transition-colors">
              <div className={cn('p-2 rounded-lg shrink-0', cat.bg)}>
                <Icon className={cn('h-4 w-4', cat.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] font-semibold uppercase', cat.color)}>{cat.label}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                    rec.impact === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                    rec.impact === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}>
                    {rec.impact === 'high' ? 'Prioritaire' : rec.impact === 'medium' ? 'Recommandé' : 'Optionnel'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{rec.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rec.description}</p>
                <Link href={rec.link} className="inline-flex items-center gap-1 text-xs font-semibold text-brand mt-2 hover:underline">
                  {rec.action} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
