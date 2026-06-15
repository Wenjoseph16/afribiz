'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays, MapPin, Clock, Users, Download, Share2,
  Search, QrCode, ChevronRight, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useBookings } from '@/features/hooks';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  CONFIRMED: { label: 'Confirmé', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'warning' },
  COMPLETED: { label: 'Terminé', variant: 'default' },
  CANCELLED: { label: 'Annulé', variant: 'danger' },
  CHECKED_IN: { label: 'Scanné', variant: 'info' },
  UPCOMING: { label: 'À venir', variant: 'info' },
};

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'upcoming', label: 'À venir' },
  { key: 'completed', label: 'Passés' },
  { key: 'cancelled', label: 'Annulés' },
];

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data: bookingsData, isLoading, error, refetch } = useBookings({ limit: 100 });

  const allBookings = Array.isArray(bookingsData?.bookings || bookingsData)
    ? (bookingsData?.bookings || bookingsData) as any[]
    : [];

  // Filter only event-type bookings
  const allEvents = useMemo(() =>
    allBookings.filter((b: any) =>
      b.type === 'EVENT' || b.type === 'TRAINING' || b.type === 'CONFERENCE' || b.type === 'WORKSHOP'
    ),
    [allBookings]
  );

  const now = new Date();

  const stats = useMemo(() => ({
    total: allEvents.length,
    upcoming: allEvents.filter((e: any) => new Date(e.startDate || e.date) > now).length,
    completed: allEvents.filter((e: any) => new Date(e.endDate || e.startDate || e.date) < now).length,
    cancelled: allEvents.filter((e: any) => e.status === 'CANCELLED').length,
    totalSpent: allEvents.reduce((sum: number, e: any) => sum + Number(e.price || e.totalAmount || 0), 0),
  }), [allEvents, now]);

  const filtered = useMemo(() => {
    let f = [...allEvents];
    switch (activeTab) {
      case 'upcoming': f = f.filter((e: any) => new Date(e.startDate || e.date) > now && e.status !== 'CANCELLED'); break;
      case 'completed': f = f.filter((e: any) => new Date(e.endDate || e.startDate || e.date) < now || e.status === 'COMPLETED'); break;
      case 'cancelled': f = f.filter((e: any) => e.status === 'CANCELLED'); break;
    }
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((e: any) =>
        e.title?.toLowerCase().includes(q) ||
        e.businessName?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
      );
    }
    return f;
  }, [allEvents, activeTab, search, now]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mes événements"
        description="Retrouvez tous vos billets et inscriptions aux événements"
        breadcrumbs={[{ label: 'Événements' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">À venir</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.upcoming}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Passés</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {allEvents.reduce((sum: number, e: any) => sum + (e.participants || e.guests || 1), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" />}
          title="Aucun événement"
          description={
            search
              ? 'Essayez une autre recherche'
              : "Vous n'êtes inscrit à aucun événement pour le moment. Découvrez les événements près de chez vous."
          }
          action={
            <Link href="/dashboard/explore">
              <Button>Découvrir des événements</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((event: any) => {
            const statusInfo = STATUS_CONFIG[event.status] || { label: event.status, variant: 'default' as const };
            const eventDate = new Date(event.startDate || event.date);
            const isPast = new Date(event.endDate || event.startDate || event.date) < now;
            const isToday = eventDate.toDateString() === now.toDateString();

            return (
              <Card key={event.id} className="p-5 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-start gap-4">
                  {/* Date badge */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/20 dark:to-emerald-900/20 flex flex-col items-center justify-center shrink-0 border border-brand-100 dark:border-brand-800/30">
                    <span className="text-[10px] font-bold text-brand uppercase leading-tight">
                      {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-brand leading-tight">
                      {eventDate.getDate()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {event.title || event.businessName || 'Événement'}
                          </h3>
                          <Badge variant={statusInfo.variant} size="xs">
                            {statusInfo.label}
                          </Badge>
                          {isToday && (
                            <span className="text-[10px] font-medium text-brand bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded-full">
                              Aujourd&apos;hui
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {event.businessName || event.business || 'Organisateur'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {event.price > 0 && (
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {Number(event.price || 0).toLocaleString()} FCFA
                          </p>
                        )}
                        {event.price === 0 && (
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                            Gratuit
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {eventDate.toLocaleDateString('fr-FR', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                      {event.guests && event.guests > 1 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {event.guests} personne(s)
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {!isPast && event.status !== 'CANCELLED' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Button variant="secondary" size="xs"
                          onClick={() => {
                            const url = window.location.origin + '/dashboard/my-events/' + event.id;
                            if (navigator.share) { navigator.share({ title: event.title, url }); }
                            else { navigator.clipboard.writeText(url); alert('Lien copié !'); }
                          }}>
                          <QrCode className="h-3 w-3 mr-1" />
                          QR Code
                        </Button>
                        <Button variant="ghost" size="xs"
                          onClick={() => alert('Votre billet est disponible dans votre boîte email.')}>
                          <Download className="h-3 w-3 mr-1" />
                          Billet
                        </Button>
                        <Button variant="ghost" size="xs"
                          onClick={() => {
                            const url = window.location.origin + '/dashboard/my-events/' + event.id;
                            if (navigator.share) { navigator.share({ title: event.title, text: 'Rejoignez-moi à cet événement !', url }); }
                            else { navigator.clipboard.writeText(url); alert('Lien copié dans le presse-papiers !'); }
                          }}>
                          <Share2 className="h-3 w-3 mr-1" />
                          Partager
                        </Button>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0 mt-1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
