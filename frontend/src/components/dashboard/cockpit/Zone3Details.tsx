'use client';

import Link from 'next/link';
import {
  ShoppingBag,
  Calendar,
  Star,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

interface OrderItem {
  id: string;
  orderNumber?: string | null;
  totalAmount?: number | null;
  status?: string | null;
  createdAt?: string | null;
}

interface BookingItem {
  id: string;
  serviceName?: string | null;
  type?: string | null;
  date?: string | null;
  startDate?: string | null;
  status?: string | null;
}

interface ReviewItem {
  id: string;
  rating?: number | null;
  comment?: string | null;
  authorName?: string | null;
  user?: { firstName?: string; lastName?: string } | null;
  createdAt?: string | null;
}

/* ─── Module label mapping ─── */

const MODULE_LABELS: Record<string, string> = {
  PRODUCTS: 'Produits',
  SERVICES: 'Services',
  MENU: 'Menu',
  ROOMS: 'Chambres',
  BOOKINGS: 'Réservations',
  ORDERS: 'Commandes',
  QUOTES_INVOICES: 'Devis & Factures',
  DEBTS_PAYMENTS: 'Dettes',
  PROMOTIONS: 'Promotions',
  PLANNING: 'Planning',
  EMPLOYEES: 'Employés',
  PORTFOLIO: 'Portfolio',
  SUBSCRIPTIONS: 'Abonnements',
  DELIVERIES: 'Livraisons',
  EVENTS: 'Événements',
  RENTALS: 'Locations',
  DOCUMENTS: 'Documents',
  PARTNERS: 'Partenaires',
  DISPUTES: 'Litiges',
  MODULE_MARKETPLACE: 'Marketplace',
  ADVANCED_TASKS: 'Tâches',
  TRAINING: 'Formations',
  SAVINGS: 'Épargne',
  CRM: 'CRM',
  MARKETING: 'Marketing',
  MEDIA: 'Média',
  AFRISCORE: 'AfriScore',
  GROUP_BUY: 'Achat groupé',
  VOICE: 'Voix',
};

const MODULE_ROUTES: Record<string, string> = {
  PRODUCTS: '/dashboard/products',
  SERVICES: '/dashboard/services',
  MENU: '/dashboard/menu',
  ROOMS: '/dashboard/rooms',
  BOOKINGS: '/dashboard/bookings',
  ORDERS: '/dashboard/orders',
  PROMOTIONS: '/dashboard/promotions',
  PORTFOLIO: '/dashboard/portfolio',
  EVENTS: '/dashboard/events',
  RENTALS: '/dashboard/rentals',
  TRAINING: '/dashboard/trainings',
  EMPLOYEES: '/dashboard/employees',
  DELIVERIES: '/dashboard/deliveries',
  CRM: '/dashboard/crm',
};

function moduleLabel(mod: string): string {
  return MODULE_LABELS[mod] || mod.toLowerCase().replace(/_/g, ' ');
}

function moduleRoute(mod: string): string {
  return MODULE_ROUTES[mod] || '/dashboard/marketplace';
}

function orderStatusLabel(s?: string | null) {
  switch (s) {
    case 'DELIVERED': return 'Livrée';
    case 'CONFIRMED': return 'Confirmée';
    case 'CANCELLED': return 'Annulée';
    case 'PENDING': return 'En attente';
    default: return s || '—';
  }
}

function orderStatusColor(s?: string | null) {
  switch (s) {
    case 'DELIVERED': return 'text-emerald-600';
    case 'CONFIRMED': return 'text-blue-600';
    case 'CANCELLED': return 'text-red-500';
    default: return 'text-amber-600';
  }
}

function bookingStatusLabel(s?: string | null) {
  switch (s) {
    case 'confirmed': case 'CONFIRMED': return 'Confirmée';
    case 'pending': case 'PENDING': return 'En attente';
    case 'cancelled': case 'CANCELLED': return 'Annulée';
    default: return s || '—';
  }
}

function bookingStatusColor(s?: string | null) {
  switch (s) {
    case 'confirmed': case 'CONFIRMED': return 'text-emerald-600';
    case 'pending': case 'PENDING': return 'text-amber-600';
    case 'cancelled': case 'CANCELLED': return 'text-red-500';
    default: return 'text-slate-500';
  }
}

/* ─── Props ─── */

export interface Zone3Props {
  orders: OrderItem[];
  bookings: BookingItem[];
  reviews: ReviewItem[];
  modules: string[];
}

export function Zone3Details({ orders, bookings, reviews, modules }: Zone3Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Recent Orders */}
      {orders.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Dernières commandes
            </h3>
            <Link
              href="/dashboard/orders"
              className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              Voir tout <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      #{order.orderNumber?.slice(-6) || order.id.slice(0, 8)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('fr-FR')
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-slate-800 tabular-nums">
                    {Number(order.totalAmount || 0).toLocaleString('fr-FR')} F
                  </p>
                  <p className={cn('text-[11px] font-medium', orderStatusColor(order.status))}>
                    {orderStatusLabel(order.status)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Bookings */}
      {bookings.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Réservations à venir
            </h3>
            <Link
              href="/dashboard/bookings"
              className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              Voir tout <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {bookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {b.serviceName || b.type || 'Réservation'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(b.date || b.startDate)
                        ? new Date(b.date || b.startDate!).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
                <p className={cn('text-[11px] font-medium shrink-0 ml-3', bookingStatusColor(b.status))}>
                  {bookingStatusLabel(b.status)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Derniers avis
            </h3>
            <Link
              href="/dashboard/reviews"
              className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              Voir tout <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-800">
                    {r.authorName || (r.user?.firstName ? `${r.user.firstName} ${r.user.lastName || ''}`.trim() : 'Client')}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3 w-3',
                          i < (r.rating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        )}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-xs text-slate-500 line-clamp-2">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Modules */}
      {modules.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Modules actifs
            </h3>
            <Link
              href="/dashboard/marketplace"
              className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              Marketplace <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {modules.map((mod) => (
              <Link
                key={mod}
                href={moduleRoute(mod)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {moduleLabel(mod)}
              </Link>
            ))}
            <Link
              href="/dashboard/marketplace"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 text-[11px] font-medium rounded-full border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Ajouter
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
