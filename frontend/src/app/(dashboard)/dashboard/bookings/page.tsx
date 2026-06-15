'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar, Search, Clock, ChevronRight, CheckCircle2, XCircle,
  DollarSign, Loader, Store, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useBookings } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED: { label: 'Confirmée', variant: 'success', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  IN_PROGRESS: { label: 'En cours', variant: 'info', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  COMPLETED: { label: 'Terminée', variant: 'default', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  CANCELLED: { label: 'Annulée', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  RESCHEDULED: { label: 'Reportée', variant: 'info', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

const TYPE_LABELS: Record<string, string> = {
  SERVICE: 'Service', ROOM: 'Chambre', EVENT: 'Événement', RESOURCE: 'Ressource', TABLE: 'Restaurant',
};


const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'upcoming', label: 'À venir' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'CONFIRMED', label: 'Confirmées' },
  { key: 'IN_PROGRESS', label: 'En cours' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'CANCELLED', label: 'Annulées' },
];

export default function ClientBookingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const { data: bookingsData, isLoading, error, refetch } = useBookings({ limit: 100 });

  const allBookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.bookings || bookingsData?.data || []);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const stats = {
    total: allBookings.length,
    today: allBookings.filter((b: any) => (b.startDate || '').startsWith(todayStr)).length,
    pending: allBookings.filter((b: any) => b.status === 'PENDING').length,
    active: allBookings.filter((b: any) => ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
    spent: allBookings.filter((b: any) => ['COMPLETED', 'IN_PROGRESS'].includes(b.status)).reduce((a: number, b: any) => a + Number(b.price || 0), 0),
  };

  const suggestions = useMemo(() => {
    const items: {
      type: string; title: string; description: string; count: string;
      link: string; icon: React.ReactNode; bg: string; border: string; iconBg: string; countColor: string;
    }[] = [];

    const pending = allBookings.filter((b: any) => b.status === 'PENDING');
    if (pending.length > 0) {
      items.push({
        type: 'pending', title: 'En attente de confirmation',
        description: 'Ces réservations nécessitent votre action.',
        count: `${pending.length}`, link: '#',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        bg: '#fffbeb', border: '#fde68a', iconBg: '#fef3c7', countColor: '#d97706',
      });
    }

    const today = allBookings.filter((b: any) => (b.startDate || '').startsWith(todayStr) && ['CONFIRMED', 'PENDING'].includes(b.status));
    if (today.length > 0) {
      items.push({
        type: 'today', title: "Aujourd'hui",
        description: 'Réservations à venir ou en cours aujourd\'hui.',
        count: `${today.length}`, link: '#',
        icon: <Calendar className="h-5 w-5 text-blue-600" />,
        bg: '#eff6ff', border: '#bfdbfe', iconBg: '#dbeafe', countColor: '#2563eb',
      });
    }

    const recentCancelled = allBookings.filter((b: any) => b.status === 'CANCELLED' && (b.updatedAt || '') >= weekAgo);
    if (recentCancelled.length > 0) {
      items.push({
        type: 'cancelled', title: 'Annulations récentes',
        description: `${recentCancelled.length} réservation(s) annulée(s) cette semaine.`,
        count: `${recentCancelled.length}`, link: '#',
        icon: <XCircle className="h-5 w-5 text-red-600" />,
        bg: '#fef2f2', border: '#fecaca', iconBg: '#fee2e2', countColor: '#dc2626',
      });
    }

    const upcomingValue = allBookings
      .filter((b: any) => (b.startDate || '') >= todayStr && ['CONFIRMED', 'PENDING'].includes(b.status))
      .reduce((a: number, b: any) => a + Number(b.price || 0), 0);
    if (upcomingValue > 0) {
      items.push({
        type: 'revenue', title: 'Revenu potentiel',
        description: 'Valeur totale des réservations à venir.',
        count: `${upcomingValue.toLocaleString()} FCFA`, link: '#',
        icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
        bg: '#ecfdf5', border: '#a7f3d0', iconBg: '#d1fae5', countColor: '#059669',
      });
    }

    return items;
  }, [allBookings, todayStr, weekAgo]);

  const filtered = allBookings.filter((b: any) => {
    if (activeTab === 'today' && !(b.startDate || '').startsWith(todayStr)) return false;
    if (activeTab === 'upcoming') {
      if (new Date(b.startDate || b.date) < now || ['CANCELLED', 'COMPLETED'].includes(b.status)) return false;
    }
    if (!['all', 'today', 'upcoming'].includes(activeTab) && b.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (b.bookingNumber || '').toLowerCase().includes(q) ||
        (b.business?.name || b.businessName || '').toLowerCase().includes(q) ||
        (b.title || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Mes réservations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consultez l&apos;historique de vos réservations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><Calendar className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.total}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Aujourd'hui</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.today}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">En attente</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.pending}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-purple-100"><DollarSign className="w-4 h-4 text-purple-600" /></div><div><p className="text-[10px] text-gray-500">Dépensé</p><p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(stats.spent)}</p></div></div></Card>
      </div>

      {/* Suggestions intelligentes */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestions.map(s => (
            <Link key={s.type} href={s.link} className="block p-4 rounded-2xl border transition-all hover:shadow-sm" style={{ backgroundColor: s.bg, borderColor: s.border }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.iconBg }}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{s.description}</p>
                </div>
                <span className="text-xs font-bold" style={{ color: s.countColor }}>{s.count}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>{tab.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par n° réservation, entreprise..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune réservation</h3>
          <p className="text-sm text-gray-500 mb-4">{search ? 'Essayez une autre recherche.' : 'Explorez les entreprises pour réserver'}</p>
          <Link href="/dashboard/explore"><Button><Store className="h-4 w-4 mr-1.5" />Explorer</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking: any) => {
            const s = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            const startDate = new Date(booking.startDate || booking.date);
            const isToday = (booking.startDate || '').startsWith(todayStr);
            const businessName = booking.business?.name || booking.businessName || '—';
            return (
              <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`} className="block">
                <Card className="p-4 hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.color)}><Calendar className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{booking.title}</h3>
                            <Badge variant={s.variant} size="xs">{s.label}</Badge>
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{TYPE_LABELS[booking.type] || booking.type}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="font-medium">{booking.bookingNumber || `#${booking.id.slice(0, 8)}`}</span>
                            <span className="flex items-center gap-1"><Store className="w-3 h-3" />{businessName}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(Number(booking.price || 0))}</p>
                          {booking.guests > 1 && <p className="text-[10px] text-gray-400">{booking.guests} pers.</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{startDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {isToday && <span className="text-[10px] font-medium text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">Aujourd'hui</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0 mt-2" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
