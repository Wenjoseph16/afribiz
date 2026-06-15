'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays, Plus, Search, Grid3X3, List, Eye, Pencil,
  Users, Star, MapPin, Clock, TrendingUp, Loader,
  Sparkles, AlertTriangle, Award, DollarSign, BarChart3,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useMyEvents, useEventDashboardStats } from '@/features/hooks';

interface EventItem {
  id: string; title: string; description: string; category: string;
  startDate: string; endDate: string; location: string; image?: string;
  status: string; isFeatured: boolean; ticketCount: number;
  participantCount: number; rating: number; createdAt: string;
}

type TabType = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export default function EventsPage() {
  const { data: eventsData, isLoading, error, refetch } = useMyEvents();
  const { data: statsData } = useEventDashboardStats();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const allEvents: EventItem[] = Array.isArray(eventsData) ? eventsData : (eventsData?.events || eventsData?.data || []);

  const stats = {
    total: allEvents.length,
    upcoming: allEvents.filter(e => e.status === 'UPCOMING' || e.status === 'PUBLISHED').length,
    participants: allEvents.reduce((a, e) => a + (e.participantCount || 0), 0),
    avgRating: allEvents.length > 0 ? allEvents.reduce((a, e) => a + (e.rating || 0), 0) / allEvents.length : 0,
    totalRevenue: 0,
    fillRate: 0,
    ...(statsData || {}),
  };

  const now = new Date();
  const filtered = useMemo(() => {
    let f = [...allEvents];
    switch (activeTab) {
      case 'upcoming': f = f.filter(e => new Date(e.startDate) > now); break;
      case 'ongoing': f = f.filter(e => new Date(e.startDate) <= now && new Date(e.endDate) >= now); break;
      case 'completed': f = f.filter(e => new Date(e.endDate) < now); break;
      case 'cancelled': f = f.filter(e => e.status === 'CANCELLED'); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(e => e.title.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q));
    }
    return f;
  }, [allEvents, activeTab, searchQuery]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Événements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos événements et billetterie</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/events/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Créer un événement</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard icon={<CalendarDays className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total" value={stats.total} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" label="À venir" value={stats.upcoming} />
        <StatsCard icon={<Users className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Participants" value={stats.participants} />
        <StatsCard icon={<Star className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Note moyenne" value={stats.avgRating.toFixed(1)} />
        <StatsCard icon={<DollarSign className="h-5 w-5" />} iconBg="bg-green-50" iconColor="text-green-600" label="Revenus" value={Number(stats.totalRevenue).toLocaleString() + ' FCFA'} />
        <StatsCard icon={<BarChart3 className="h-5 w-5" />} iconBg="bg-teal-50" iconColor="text-teal-600" label="Taux remplissage" value={stats.fillRate ? stats.fillRate + '%' : '—'} />
      </div>

      {/* Suggestions intelligentes */}
      {allEvents.length > 0 && (() => {
        const upcoming = allEvents.filter(e => new Date(e.startDate) > now);
        const ongoing = allEvents.filter(e => new Date(e.startDate) <= now && new Date(e.endDate) >= now);
        const cancelledThisMonth = allEvents.filter(e => e.status === 'CANCELLED');
        const bestRated = allEvents.filter(e => (e.rating || 0) >= 4.5);

        const suggestions = [
          upcoming.length > 0 && {
            type: 'upcoming' as const,
            icon: CalendarDays,
            title: `${upcoming.length} événement${upcoming.length > 1 ? 's' : ''} à venir`,
            desc: 'Préparez-vous pour les prochains événements planifiés',
            color: 'blue' as const,
            link: '/dashboard/events?tab=upcoming',
          },
          ongoing.length > 0 && {
            type: 'ongoing' as const,
            icon: Sparkles,
            title: `${ongoing.length} événement${ongoing.length > 1 ? 's' : ''} en cours`,
            desc: 'Suivez le déroulement en temps réel',
            color: 'emerald' as const,
            link: '/dashboard/events?tab=ongoing',
          },
          cancelledThisMonth.length > 0 && {
            type: 'cancelled' as const,
            icon: AlertTriangle,
            title: `${cancelledThisMonth.length} annulation${cancelledThisMonth.length > 1 ? 's' : ''}`,
            desc: 'Analysez les motifs et ajustez votre planning',
            color: 'amber' as const,
            link: '/dashboard/events?tab=cancelled',
          },
          bestRated.length > 0 && {
            type: 'best_rated' as const,
            icon: Award,
            title: `${bestRated.length} événement${bestRated.length > 1 ? 's' : ''} les mieux notés`,
            desc: 'Mettez-les en avant pour attirer plus de participants',
            color: 'purple' as const,
            link: '/dashboard/events',
          },
        ].filter(Boolean);

        if (suggestions.length === 0) return null;

        const colorMap: Record<string, string> = {
          blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
          emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
          amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
          purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any, i: number) => (
              <Link key={i} href={s.link}
                className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colorMap[s.color]} border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200`}>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                  <s.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}


      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(['all', 'upcoming', 'ongoing', 'completed', 'cancelled'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>
              {tab === 'all' ? 'Tous' : tab === 'upcoming' ? 'À venir' : tab === 'ongoing' ? 'En cours' : tab === 'completed' ? 'Terminés' : 'Annulés'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un événement..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarDays className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun événement trouvé</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre premier événement'}
          </p>
          <Link href="/dashboard/events/new"><Button><Plus className="h-4 w-4 mr-1.5" />Créer un événement</Button></Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Événement</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lieu</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Participants</th>
                <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getBadges(event: EventItem) {
  const badges: { label: string; class: string }[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const isPopular = (event.participantCount || 0) >= 50;
  const isWellRated = (event.rating || 0) >= 4.5;
  const isNew = event.createdAt && new Date(event.createdAt) > thirtyDaysAgo;
  if (isPopular) badges.push({ label: '🔥 Populaire', class: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300' });
  if (isWellRated) badges.push({ label: '⭐ Bien noté', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' });
  if (isNew) badges.push({ label: '🆕 Nouveau', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' });
  if (event.isFeatured) badges.push({ label: '🏆 Vedette', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' });
  return badges;
}

function EventCard({ event }: { event: EventItem }) {
  const startDate = new Date(event.startDate);
  const isPast = new Date(event.endDate) < new Date();
  const badges = getBadges(event);
  return (
    <Link href={`/dashboard/events/${event.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="aspect-video bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/20 dark:to-emerald-900/20 flex items-center justify-center relative">
        <CalendarDays className="h-12 w-12 text-brand/30 dark:text-brand-400/30" />
        {badges.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-1">
            {badges.map((b, i) => (
              <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm">
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{event.title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {event.participantCount || 0} participants
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', {
            'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20': event.status === 'PUBLISHED' || event.status === 'UPCOMING',
            'text-blue-600 bg-blue-50 dark:bg-blue-900/20': event.status === 'ONGOING',
            'text-gray-500 bg-gray-100 dark:bg-gray-800': event.status === 'COMPLETED' || isPast,
            'text-red-600 bg-red-50 dark:bg-red-900/20': event.status === 'CANCELLED',
          })}>
            {event.status === 'CANCELLED' ? 'Annulé' : isPast ? 'Terminé' : event.status === 'ONGOING' ? 'En cours' : 'Actif'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventRow({ event }: { event: EventItem }) {
  const startDate = new Date(event.startDate);
  const isPast = new Date(event.endDate) < new Date();
  const badges = getBadges(event);
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <CalendarDays className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
            <p className="text-xs text-gray-500">{event.category}</p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {badges.map((b, i) => (
                  <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </td>
      <td className="p-4"><span className="text-sm text-gray-600 dark:text-gray-300">{event.location || '-'}</span></td>
      <td className="p-4 text-right"><span className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.participantCount || 0}</span></td>
      <td className="p-4 text-center">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', {
          'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20': event.status === 'PUBLISHED' || event.status === 'UPCOMING',
          'text-blue-600 bg-blue-50 dark:bg-blue-900/20': event.status === 'ONGOING',
          'text-gray-500 bg-gray-100 dark:bg-gray-800': isPast,
          'text-red-600 bg-red-50 dark:bg-red-900/20': event.status === 'CANCELLED',
        })}>
          {event.status === 'CANCELLED' ? 'Annulé' : isPast ? 'Terminé' : event.status === 'ONGOING' ? 'En cours' : 'Actif'}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/events/${event.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/dashboard/events/${event.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
