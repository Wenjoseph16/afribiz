'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Search,
  Clock,
  DollarSign,
  Loader,
  Store,
  AlertTriangle,
  User,
  MapPin,
  Users,
  ChevronRight,
  CalendarCheck,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { Drawer } from '@/components/ui/Drawer';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/utils/helpers';
import { CopilotTips } from '@/components/copilot/CopilotTips';

// ─── Configuration des statuts → LiveBadge (langage 2027 : temps réel) ───
const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'success' | 'danger' | 'warning' | 'brand' | 'muted'; pulse?: boolean }
> = {
  PENDING: { label: 'En attente', tone: 'warning', pulse: true },
  CONFIRMED: { label: 'Confirmée', tone: 'success' },
  IN_PROGRESS: { label: 'En cours', tone: 'brand' },
  COMPLETED: { label: 'Terminée', tone: 'muted' },
  CANCELLED: { label: 'Annulée', tone: 'danger' },
  RESCHEDULED: { label: 'Reportée', tone: 'brand' },
};

const TYPE_LABELS: Record<string, string> = {
  SERVICE: 'Service',
  ROOM: 'Chambre',
  EVENT: 'Événement',
  RESOURCE: 'Ressource',
  TABLE: 'Restaurant',
  RENTAL: 'Location',
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  SERVICE: Store,
  ROOM: CalendarCheck,
  EVENT: Calendar,
  TABLE: Users,
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

function InfoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value || '—'}</p>
    </div>
  );
}

function bookingClient(b: any): string {
  const c = b.client;
  if (c?.firstName || c?.lastName) return `${c.firstName || ''} ${c.lastName || ''}`.trim();
  return b.contactName || b.clientName || (b.clientId ? 'Client' : 'Invité');
}

function bookingClientDetail(b: any): string {
  const c = b.client;
  if (c?.email || c?.phone) return [c.email, c.phone].filter(Boolean).join(' · ');
  return b.contactPhone || b.clientPhone || '';
}

// Formateur de date sécurisé : ne crashe jamais la page si la date est absente
function safeDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value?: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = safeDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('fr-FR', opts);
}

function formatDateTime(value?: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = safeDate(value);
  if (!d) return '—';
  return d.toLocaleString('fr-FR', opts);
}

export default function BookingsPage() {
  const { user } = useAuthStore();
  const isBusiness = user?.roles?.includes('BUSINESS') || user?.primaryRole === 'BUSINESS';
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: isBusiness ? ['business', 'bookings'] : ['bookings'],
    queryFn: async () => {
      const res = await apiClient.get(
        isBusiness ? '/business/bookings?limit=100' : '/bookings?limit=100'
      );
      return res.data.data;
    },
    enabled: !!user,
    // Secours temps réel : le socket invalide déjà la query, ceci garantit la fraîcheur
    refetchInterval: 30_000,
  });

  const allBookings = Array.isArray(bookingsData)
    ? bookingsData
    : bookingsData?.bookings || bookingsData?.data || [];
  const selectedBooking = allBookings.find((b: any) => b.id === selectedId) || null;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const stats = useMemo(() => {
    return {
      total: allBookings.length,
      today: allBookings.filter((b: any) => (b.startDate || '').startsWith(todayStr)).length,
      pending: allBookings.filter((b: any) => b.status === 'PENDING').length,
      inProgress: allBookings.filter((b: any) =>
        ['CONFIRMED', 'IN_PROGRESS'].includes(b.status)
      ).length,
      revenue: allBookings
        .filter((b: any) => ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED'].includes(b.status))
        .reduce((a: number, b: any) => a + Number(b.price || 0), 0),
    };
  }, [allBookings, todayStr]);

  const filtered = allBookings.filter((b: any) => {
    if (activeTab === 'today' && !(b.startDate || '').startsWith(todayStr)) return false;
    if (activeTab === 'upcoming') {
      if (new Date(b.startDate || b.date) < now || ['CANCELLED', 'COMPLETED'].includes(b.status))
        return false;
    }
    if (!['all', 'today', 'upcoming'].includes(activeTab) && b.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (b.bookingNumber || '').toLowerCase().includes(q) ||
        bookingClient(b).toLowerCase().includes(q) ||
        (b.business?.name || b.businessName || '').toLowerCase().includes(q) ||
        (b.title || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Centre de gestion des réservations"
        description={
          isBusiness
            ? 'Confirmez, planifiez et suivez chaque réservation de vos clients en temps réel'
            : "Suivez toutes vos réservations — passées, à venir et en cours"
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Réservations' },
        ]}
      />

      <CopilotTips moduleKey="BOOKINGS" />

      {/* KPIs temps réel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          label="En attente de confirmation"
          value={stats.pending}
          trend={
            stats.pending > 0
              ? { value: 'à traiter', positive: false }
              : { value: 'à jour', positive: true }
          }
        />
        <StatsCard
          icon={<Calendar className="h-5 w-5" />}
          iconBg="bg-sky-50 dark:bg-sky-900/30"
          iconColor="text-sky-600 dark:text-sky-400"
          label="Aujourd'hui"
          value={stats.today}
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          label="En cours / confirmées"
          value={stats.inProgress}
        />
        <StatsCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          label={isBusiness ? 'CA réservations' : 'Valeur'}
          value={`${stats.revenue.toLocaleString('fr-FR')} FCFA`}
        />
      </div>

      {/* Filtres */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <LiveBadge
            tone="success"
            label="Temps réel"
            value={`${stats.pending} en attente`}
          />
          <p className="text-xs text-gray-400 hidden sm:block">
            Les nouvelles réservations apparaissent instantanément
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.key
                    ? 'bg-brand text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="N° réservation, client, entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
        </div>
      </Card>

      {/* Table dense */}
      {filtered.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="Aucune réservation"
          description={
            search || activeTab !== 'all'
              ? 'Aucune réservation ne correspond à ce filtre.'
              : isBusiness
                ? "Les réservations de vos clients apparaîtront ici en temps réel dès qu'elles seront faites."
                : 'Explorez les entreprises pour réserver votre prochaine expérience.'
          }
          action={
            isBusiness ? undefined : (
              <Link href="/dashboard/explore">
                <Button size="sm">
                  <Store className="h-4 w-4 mr-1.5" />
                  Explorer le marketplace
                </Button>
              </Link>
            )
          }
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Réservation</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium text-right">Montant</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking: any) => {
                  const s = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
                  const TypeIcon = TYPE_ICONS[booking.type] || Calendar;
                  const startDate = safeDate(booking.startDate || booking.date);
                  const isToday = (booking.startDate || '').startsWith(todayStr);
                  return (
                    <tr
                      key={booking.id}
                      onClick={() => setSelectedId(booking.id)}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="min-w-[170px]">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {booking.title || booking.bookingNumber || `#${booking.id.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {booking.bookingNumber || `#${booking.id.slice(0, 8)}`}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="min-w-[150px]">
                          <p className="text-gray-900 dark:text-gray-100 font-medium truncate">
                            {bookingClient(booking)}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {bookingClientDetail(booking) || '—'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          <TypeIcon className="h-3.5 w-3.5 text-gray-400" />
                          {TYPE_LABELS[booking.type] || booking.type || '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="whitespace-nowrap">
                          <p className="text-gray-900 dark:text-gray-100">
                            {formatDate(booking.startDate || booking.date, {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {startDate
                              ? startDate.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                            {isToday && (
                              <span className="ml-1.5 font-medium text-brand">Aujourd'hui</span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <LiveBadge tone={s.tone} label={s.label} pulse={s.pulse} />
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatPrice(Number(booking.price || 0))}
                        </p>
                        {booking.guests > 1 && (
                          <p className="text-[10px] text-gray-400">{booking.guests} pers.</p>
                        )}
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setSelectedId(booking.id)}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                            Détail
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Drawer 360° réservation */}
      <Drawer
        isOpen={!!selectedBooking}
        onClose={() => setSelectedId(null)}
        icon={<Calendar className="h-5 w-5" />}
        title={selectedBooking?.title || selectedBooking?.bookingNumber || 'Réservation'}
        subtitle={
          selectedBooking
            ? formatDateTime(selectedBooking.startDate || selectedBooking.date, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined
        }
        footer={
          selectedBooking ? (
            <Link href={`/dashboard/bookings/${selectedBooking.id}`}>
              <Button variant="secondary" size="sm">
                <Calendar className="h-4 w-4" />
                Voir le détail complet
              </Button>
            </Link>
          ) : undefined
        }
      >
        {selectedBooking && (
          <div className="space-y-5">
            {/* Statut */}
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const s = STATUS_CONFIG[selectedBooking.status] || STATUS_CONFIG.PENDING;
                return <LiveBadge tone={s.tone} label={s.label} pulse={s.pulse} />;
              })()}
              {selectedBooking.business?.name && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <Store className="h-3 w-3" />
                  {selectedBooking.business.name}
                </span>
              )}
            </div>

            {/* Client */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Client
              </p>
              <div className="grid grid-cols-2 gap-3">
                <InfoStat icon={User} label="Nom" value={bookingClient(selectedBooking)} />
                <InfoStat
                  icon={Users}
                  label="Participants"
                  value={selectedBooking.guests > 1 ? `${selectedBooking.guests} pers.` : '1 pers.'}
                />
                <InfoStat
                  icon={Store}
                  label="Type"
                  value={TYPE_LABELS[selectedBooking.type] || selectedBooking.type}
                />
                <InfoStat
                  icon={MapPin}
                  label="Contact"
                  value={bookingClientDetail(selectedBooking) || '—'}
                />
              </div>
            </div>

            {/* Horaire */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                {formatDateTime(selectedBooking.startDate || selectedBooking.date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Total */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Montant de la réservation
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(Number(selectedBooking.price || 0))}
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
