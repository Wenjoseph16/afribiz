'use client';

import { Star, ShoppingBag, Calendar, Package, Store } from 'lucide-react';
import Link from 'next/link';

function formatDevName(dev: any): string {
  if (!dev) return 'Développeur';
  if (typeof dev === 'string') return dev;
  return dev.companyName || (dev.user ? `${dev.user.firstName || ''} ${dev.user.lastName || ''}`.trim() : null) || 'Développeur';
}

function formatPrice(price: any): string {
  if (!price && price !== 0) return 'Gratuit';
  const n = Number(price);
  return n > 0 ? `${n.toLocaleString()} FCFA` : 'Gratuit';
}

interface RightSidebarProps {
  trending?: {
    topBusinesses?: any[];
    topProducts?: any[];
    topServices?: any[];
    topEvents?: any[];
    topModules?: any[];
  };
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
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top Business</h3>
              <Store className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {businesses.map((biz: any, i: number) => (
                <Link
                  key={biz.id}
                  href={`/business/${biz.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 w-4 shrink-0">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center text-xs font-bold text-brand shrink-0">
                    {(biz.name || 'B')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">{biz.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{biz.type || biz.category || ''} • {biz.city || ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{biz.rating || 0}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">({biz.reviewCount || 0})</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top Services</h3>
              <ShoppingBag className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {services.map((svc: any) => (
                <div key={svc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{svc.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{svc.business?.name || ''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="flex items-center gap-0.5 justify-end">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{svc.rating || svc.business?.rating || 0}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">réserv.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top Produits</h3>
              <ShoppingBag className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {products.map((prod: any) => (
                <div key={prod.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{prod.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{prod.business?.name || ''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-semibold text-brand">{Number(prod.price) > 0 ? `${Number(prod.price).toLocaleString()} F` : 'Gratuit'}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{prod.rating ? `${prod.rating}★` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top Événements</h3>
              <Calendar className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {events.map((ev: any) => (
                <div key={ev.id} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ev.title || ev.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {ev.startDate ? new Date(ev.startDate).toLocaleDateString('fr-FR') : ''}
                    {ev.address || ev.city ? ` • ${ev.address || ev.city}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-brand">{formatPrice(ev.price)}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{ev.capacity || 0} places</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {modules.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top Modules</h3>
              <Package className="h-4 w-4 text-brand" />
            </div>
            <div className="space-y-2">
              {modules.map((mod: any) => (
                <div key={mod.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{mod.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{formatDevName(mod.developer)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="flex items-center gap-0.5 justify-end">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{mod.rating || 0}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{mod.totalInstalls || 0} installs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ad Space */}
        <div className="bg-gradient-to-br from-brand to-emerald-800 dark:from-brand dark:to-emerald-900 rounded-xl p-5 text-white text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80">Publicité</p>
          <p className="text-sm font-medium mt-2">Boostez votre visibilité sur AfriBiz</p>
          <p className="text-xs text-emerald-200/70 mt-1">Des emplacements pub dès 15 000 FCFA/semaine</p>
          <button className="mt-3 text-xs font-semibold bg-white text-brand px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors">
            En savoir plus
          </button>
        </div>
      </div>
    </aside>
  );
}
