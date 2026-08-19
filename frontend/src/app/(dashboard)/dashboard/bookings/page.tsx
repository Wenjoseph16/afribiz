'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Search, Clock, DollarSign, Loader, Store, AlertTriangle,
  User, MapPin, Users, ChevronRight, CalendarCheck, ArrowUpRight, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/utils/helpers';
import { LiveIndicator } from '@/components/ui/LiveIndicator';

const STATUS_CONFIG: Record<string, { label: string; tone: string; dot: string }> = {
  PENDING: { label: 'En attente', tone: 'amber', dot: 'bg-amber-400 animate-pulse-soft' },
  CONFIRMED: { label: 'Confirmée', tone: 'emerald', dot: 'bg-emerald-400' },
  IN_PROGRESS: { label: 'En cours', tone: 'blue', dot: 'bg-blue-400' },
  COMPLETED: { label: 'Terminée', tone: 'gray', dot: 'bg-white/30' },
  CANCELLED: { label: 'Annulée', tone: 'red', dot: 'bg-red-400' },
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'upcoming', label: 'À venir' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'CONFIRMED', label: 'Confirmées' },
  { key: 'COMPLETED', label: 'Terminées' },
];

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('glass rounded-2xl', className)}>
      {children}
    </div>
  );
}

export default function BookingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isBusiness = user?.roles?.includes('BUSINESS') || user?.primaryRole === 'BUSINESS';
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data: bookingsData, isLoading, refetch } = useQuery({
    queryKey: isBusiness ? ['business', 'bookings'] : ['bookings'],
    queryFn: async () => {
      const res = await apiClient.get(isBusiness ? '/business/bookings?limit=100' : '/bookings?limit=100');
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const allBookings = Array.isArray(bookingsData) ? bookingsData : bookingsData?.bookings || bookingsData?.data || [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const stats = useMemo(() => ({
    total: allBookings.length,
    pending: allBookings.filter((b: any) => b.status === 'PENDING').length,
    confirmed: allBookings.filter((b: any) => b.status === 'CONFIRMED').length,
    revenue: allBookings.filter((b: any) => ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED'].includes(b.status)).reduce((a: number, b: any) => a + Number(b.price || 0), 0),
  }), [allBookings]);

  const filtered = allBookings.filter((b: any) => {
    if (activeTab === 'upcoming') {
      if (new Date(b.startDate || b.date) < now || ['CANCELLED', 'COMPLETED'].includes(b.status)) return false;
    }
    if (!['all', 'upcoming'].includes(activeTab) && b.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (b.bookingNumber || '').toLowerCase().includes(q) || (b.title || '').toLowerCase().includes(q) || (b.customerName || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader className="h-8 w-8 animate-spin text-emerald-400" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-3">
            <CalendarCheck className="w-3 h-3" />
            Réservations
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Mes réservations</h1>
          <p className="text-white/30 text-sm mt-0.5">{stats.total} réservation{stats.total > 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <Link href="/dashboard/bookings/new">
            <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-sm font-bold rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Nouvelle
            </button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'En attente', value: stats.pending, icon: AlertTriangle, color: 'amber' },
          { label: 'Confirmées', value: stats.confirmed, icon: CalendarCheck, color: 'blue' },
          { label: 'Total', value: stats.total, icon: Calendar, color: 'white' },
          { label: 'Revenu', value: `${stats.revenue.toLocaleString()} FCFA`, icon: DollarSign, color: 'emerald' },
        ].map((kpi) => (
          <GlassCard key={kpi.label}>
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', `bg-${kpi.color}-500/10 border border-${kpi.color}-500/20`)}>
                <kpi.icon className={cn('w-4 h-4', `text-${kpi.color}-400`)} />
              </div>
              <div>
                <p className="text-xl font-bold text-white tabular-nums">{kpi.value}</p>
                <p className="text-[10px] text-white/30 font-medium">{kpi.label}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'glass text-white/40 hover:border-white/15'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:border-emerald-500/40 focus:ring-0 outline-none transition-all"
          />
        </div>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-white/15 mx-auto mb-4" />
            <p className="text-sm text-white/40 mb-4">Aucune réservation</p>
            <Link href="/dashboard/bookings/new">
              <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl hover:bg-emerald-500/20 transition-all duration-200">
                <Plus className="w-4 h-4" /> Créer une réservation
              </button>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((booking: any, idx: number) => {
              const s = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
              const startDate = new Date(booking.startDate || booking.date);
              const isToday = (booking.startDate || '').startsWith(todayStr);
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <button
                    onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                    className="w-full glass rounded-2xl hover:border-emerald-500/20 transition-all duration-300 group text-left"
                  >
                    <div className="relative rounded-[calc(1rem-0.1875rem)] bg-gradient-to-br from-white/[0.02] to-transparent p-4">
                      <div className="absolute inset-0 rounded-[calc(1rem-0.1875rem)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <CalendarCheck className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {booking.title || booking.bookingNumber || `#${booking.id.slice(0, 8)}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-white/30">
                                {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                {' · '}
                                {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isToday && <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Aujourd&apos;hui</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-white tabular-nums">
                              {formatPrice(Number(booking.price || 0))}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
                              <span className="text-[10px] text-white/40 font-medium">{s.label}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
