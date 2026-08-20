'use client';

import {
  ShoppingBag,
  Calendar,
  Clock,
  Wallet,
  Truck,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { UrgentActions, UrgentAction } from './UrgentActions';

/** Aggregated stats from GET /business/stats/aggregated */
interface AggregatedToday {
  ordersCount: number;
  bookingsCount: number;
  revenue: number;
  newClients: number;
}

interface AggregatedPending {
  ordersCount: number;
  debtsAmount: number;
}

interface AggregatedTrends {
  revenueToday: number;
  revenueYesterday: number;
}

interface AggregatedAlerts {
  lowStock: number;
}

export interface Zone1Props {
  today: AggregatedToday;
  pending: AggregatedPending;
  trends: AggregatedTrends;
  alerts: AggregatedAlerts;
  caisseOuverte: boolean;
  caisseMontant: number;
}

export function Zone1Tatan({
  today,
  pending,
  trends,
  alerts,
  caisseOuverte,
  caisseMontant,
}: Zone1Props) {
  // Trend % vs hier
  const revenueTrend =
    trends.revenueYesterday > 0
      ? {
          value: `${trends.revenueToday > trends.revenueYesterday ? '+' : '-'}${Math.abs(
            Math.round(
              ((trends.revenueToday - trends.revenueYesterday) / trends.revenueYesterday) * 100
            )
          )}% vs hier`,
          positive: trends.revenueToday >= trends.revenueYesterday,
        }
      : undefined;

  // Build urgent actions (only if > 0)
  const urgentActions: UrgentAction[] = [];
  if (pending.ordersCount > 0) {
    urgentActions.push({
      id: 'pending-orders',
      icon: <ShoppingBag className="h-4 w-4" />,
      label: `${pending.ordersCount} commande${pending.ordersCount > 1 ? 's' : ''} à confirmer`,
      count: pending.ordersCount,
      color: 'amber',
      href: '/dashboard/orders',
    });
  }
  if (pending.debtsAmount > 0) {
    urgentActions.push({
      id: 'debts',
      icon: <CreditCard className="h-4 w-4" />,
      label: `Créances à encaisser`,
      count: pending.debtsAmount,
      color: 'red',
      href: '/dashboard/debts-payments',
    });
  }
  if (alerts.lowStock > 0) {
    urgentActions.push({
      id: 'low-stock',
      icon: <Truck className="h-4 w-4" />,
      label: `${alerts.lowStock} produit${alerts.lowStock > 1 ? 's' : ''} en stock faible`,
      count: alerts.lowStock,
      color: 'amber',
      href: '/dashboard/products',
    });
  }

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="CA aujourd'hui"
          value={`${today.revenue.toLocaleString('fr-FR')} F`}
          trend={revenueTrend}
        />
        <StatsCard
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Commandes"
          value={today.ordersCount}
          trend={
            pending.ordersCount > 0
              ? { value: `${pending.ordersCount} en attente`, positive: false }
              : undefined
          }
        />
        <StatsCard
          icon={<Calendar className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Réservations"
          value={today.bookingsCount}
        />
        <StatsCard
          icon={<Wallet className="h-5 w-5" />}
          iconBg={caisseOuverte ? 'bg-emerald-50' : 'bg-slate-100'}
          iconColor={caisseOuverte ? 'text-emerald-600' : 'text-slate-400'}
          label="Caisse"
          value={caisseOuverte ? `${caisseMontant.toLocaleString('fr-FR')} F` : 'Fermée'}
        />
      </div>

      {/* Urgent Actions — only if there are actions */}
      {urgentActions.length > 0 && <UrgentActions actions={urgentActions} />}
    </div>
  );
}
