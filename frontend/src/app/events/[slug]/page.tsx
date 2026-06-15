'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar, MapPin, Clock, Users, Ticket, ArrowRight,
  ChevronLeft, AlertCircle, CalendarDays,
} from 'lucide-react';
import AdSlot from '@/components/ads/AdSlot';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return null;

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-full">
      <Clock size={12} />
      <span>{d}j {h}h {m}m {s}s</span>
    </div>
  );
}

function EventCard({ event, slug }: { event: any; slug: string }) {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isPast = endDate && endDate < new Date();
  const isUpcoming = !isPast && startDate > new Date();
  const ticketInfo = event.tickets?.[0];
  const ticketCount = event.ticketCount || event.tickets?.length || 0;
  const hasTickets = ticketCount > 0 || !!ticketInfo;

  return (
    <Link
      href={`/events/${slug}/${event.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200"
    >
      <div className="aspect-video bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 flex items-center justify-center relative">
        {event.image ? (
          <Image src={event.image ?? ''} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
        ) : (
          <CalendarDays className="h-12 w-12 text-indigo-300 dark:text-indigo-500/50" />
        )}
        <div className="absolute top-2 right-2 flex flex-wrap gap-1">
          {isUpcoming && <CountdownTimer targetDate={startDate} />}
          {event.isFeatured && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              En vedette
            </span>
          )}
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Calendar size={14} className="shrink-0" />
          <span>{startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>à</span>
          <Clock size={14} className="shrink-0" />
          <span>{startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {hasTickets ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                <Ticket size={12} />
                {ticketInfo?.price > 0 ? `${Number(ticketInfo.price).toLocaleString()} FCFA` : 'Gratuit'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Users size={12} />
                {event.participantCount || 0} participant(s)
              </span>
            )}
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', {
            'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400': isUpcoming || event.status === 'PUBLISHED',
            'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400': event.status === 'ONGOING',
            'text-gray-500 bg-gray-100 dark:bg-gray-700': isPast || event.status === 'COMPLETED',
            'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400': event.status === 'CANCELLED',
          })}>
            {event.status === 'CANCELLED' ? 'Annulé' : isPast ? 'Terminé' : event.status === 'ONGOING' ? 'En cours' : 'À venir'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BusinessEventsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const { data, isLoading, error } = useQuery({
    queryKey: ['business-events', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug manquant');
      const res = await apiClient.getBusinessEvents(slug);
      return res.data.data;
    },
    enabled: !!slug,
  });

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const businessName = data?.businessName || data?.business?.name || slug?.replace(/-/g, ' ') || '';
  const events: any[] = Array.isArray(data) ? data : (data?.events || data?.data || []);

  const filtered = useMemo(() => {
    const now = new Date();
    let f = [...events];
    if (filter === 'upcoming') f = f.filter((e: any) => new Date(e.startDate) > now);
    if (filter === 'past') f = f.filter((e: any) => {
      const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
      return end < now;
    });
    return f;
  }, [events, filter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
            <div className="h-10 w-64 bg-white dark:bg-gray-800 rounded-2xl mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Événements indisponibles</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Impossible de charger les événements pour le moment.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            <ChevronLeft size={18} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-28">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <CalendarDays size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {businessName ? `Événements - ${businessName}` : 'Événements'}
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {events.length} événement{events.length !== 1 ? 's' : ''} publié{events.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-16">
        {/* Sponsored Ad */}
        <div className="mb-8">
          <AdSlot page="EVENT_PAGE" position="TOP_BANNER" />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 mb-8 inline-flex gap-1 shadow-sm">
          {(['all', 'upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                filter === tab
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab === 'all' ? 'Tous' : tab === 'upcoming' ? 'À venir' : 'Passés'}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
            <CalendarDays className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Aucun événement</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {filter === 'upcoming'
                ? "Aucun événement à venir pour le moment. Revenez bientôt !"
                : filter === 'past'
                ? "Aucun événement passé."
                : "Aucun événement n'a été publié pour le moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event: any) => (
              <EventCard key={event.id} event={event} slug={slug || ''} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
