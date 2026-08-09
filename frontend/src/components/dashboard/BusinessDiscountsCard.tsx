'use client';

import { BadgePercent, Receipt } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface TopPromo {
  code: string;
  count: number;
  total: number;
}

interface DiscountsStats {
  total30d: number;
  count30d: number;
  topPromos: TopPromo[];
}

/**
 * Widget cockpit : remises accordées sur 30 jours.
 * Données servies par GET /business/stats/aggregated → stats.discounts.
 * Un code promo mal saisi (ou sans code) est remonté en « AUTRE ».
 */
export default function BusinessDiscountsCard({ stats }: { stats?: DiscountsStats }) {
  const total = Number(stats?.total30d || 0);
  const count = Number(stats?.count30d || 0);
  const top = (stats?.topPromos || []).slice(0, 3);
  const hasData = total > 0 || count > 0;

  return (
    <Card padding="lg" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30">
            <BadgePercent className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Remises accordées
            </p>
            <p className="text-[11px] text-gray-400">30 derniers jours</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
          <Receipt className="h-3 w-3" />
          {count} commande{count > 1 ? 's' : ''}
        </span>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <BadgePercent className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aucune remise sur la période</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Créez une promotion ou un coupon pour dynamiser vos ventes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {total.toLocaleString()} <span className="text-sm font-medium text-gray-400">FCFA</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              offerts à vos clients via promotions et coupons
            </p>
          </div>

          {top.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Top codes promo
              </p>
              <div className="space-y-2">
                {top.map((p) => (
                  <div
                    key={p.code}
                    className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-md truncate">
                        {p.code}
                      </span>
                      <span className="text-xs text-gray-400">×{p.count}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0 ml-2">
                      -{Number(p.total).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
