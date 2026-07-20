'use client';

import { Star, ShoppingBag, Calendar, Package, Store } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import type {
  TrendingBusiness,
  TrendingData,
  TrendingEvent,
  TrendingModule,
  TrendingProduct,
  TrendingService,
} from '@/components/marketplace/cards/trending-types';

function formatDevName(
  dev:
    | { companyName?: string; user?: { firstName?: string; lastName?: string } }
    | string
    | null
    | undefined
): string {
  if (!dev) return 'Développeur';
  if (typeof dev === 'string') return dev;
  return (
    dev.companyName ||
    (dev.user ? `${dev.user.firstName || ''} ${dev.user.lastName || ''}`.trim() : null) ||
    'Développeur'
  );
}

interface RightSidebarProps {
  trending?: TrendingData;
}

export default function RightSidebar({ trending }: RightSidebarProps) {
  const businesses = trending?.topBusinesses?.length ? trending.topBusinesses.slice(0, 5) : [];
  const services = trending?.topServices?.length ? trending.topServices.slice(0, 4) : [];
  const products = trending?.topProducts?.length ? trending.topProducts.slice(0, 4) : [];
  const events = trending?.topEvents?.length ? trending.topEvents.slice(0, 3) : [];
  const modules = trending?.topModules?.length ? trending.topModules.slice(0, 4) : [];

  return (
    <aside className="w-72 shrink-0 hidden xl:block">
      <div className="sticky top-24 space-y-6">
        {businesses.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Top Business
              </h3>
              <Store className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {businesses.map((biz: TrendingBusiness, i: number) => (
                <Link
                  key={biz.id}
                  href={`/business/${biz.slug ?? biz.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 w-4 shrink-0">
                    #{i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                    {(biz.name || 'B')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                      {biz.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {biz.type || biz.category || ''} • {biz.city || ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {biz.rating || 0}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      ({biz.reviewCount || 0})
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Top Services
              </h3>
              <ShoppingBag className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {services.map((svc: TrendingService) => (
                <Link
                  key={svc.id}
                  href={
                    svc.businessSlug
                      ? `/business/${svc.businessSlug}`
                      : `/marketplace?q=${encodeURIComponent(svc.name)}`
                  }
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0">
                      S
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                        {svc.name}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {svc.businessName}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0 ml-2">
                    {formatCurrency(svc.price)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Top Produits
              </h3>
              <ShoppingBag className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {products.map((prod: TrendingProduct) => (
                <Link
                  key={prod.id}
                  href={`/business/${prod.businessSlug ?? prod.businessId}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 flex items-center justify-center text-xs font-bold text-pink-600 shrink-0">
                    P
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {formatCurrency(prod.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Événements
              </h3>
              <Calendar className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {events.map((ev: TrendingEvent) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-[10px] font-bold text-cyan-600 shrink-0">
                    {new Date(ev.date).getDate()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                      {ev.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {ev.organizer} • {ev.availableSeats} places
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {modules.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Modules
              </h3>
              <Package className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {modules.map((mod: TrendingModule) => (
                <Link
                  key={mod.id}
                  href={`/marketplace/${mod.slug ?? mod.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-600 shrink-0">
                    M
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                      {mod.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {formatDevName(mod.developer)} • {mod.installCount} installs
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                    {formatCurrency(mod.price)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
