'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Car, Calendar, Clock, MapPin, DollarSign, ChevronRight,
  Search, AlertCircle, CheckCircle2, XCircle,
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
  ACTIVE: { label: 'En cours', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmée', variant: 'info' },
  COMPLETED: { label: 'Terminée', variant: 'default' },
  CANCELLED: { label: 'Annulée', variant: 'danger' },
  RESERVED: { label: 'Réservée', variant: 'info' },
  RETURNED: { label: 'Retournée', variant: 'default' },
};

const DEPOSIT_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'default' }> = {
  PAID: { label: 'Payée', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'warning' },
  REFUNDED: { label: 'Remboursée', variant: 'default' },
  PARTIAL: { label: 'Partielle', variant: 'info' },
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'En cours' },
  { key: 'pending', label: 'À venir' },
  { key: 'completed', label: 'Terminées' },
  { key: 'cancelled', label: 'Annulées' },
];

export default function MyRentalsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data: bookingsData, isLoading, error, refetch } = useBookings({ limit: 100 });

  const allBookings = Array.isArray(bookingsData?.bookings || bookingsData)
    ? (bookingsData?.bookings || bookingsData) as any[]
    : [];

  // Filter only rental-type bookings
  const allRentals = useMemo(() =>
    allBookings.filter((b: any) =>
      b.type === 'RENTAL' || b.type === 'VEHICLE' || b.type === 'EQUIPMENT' || b.type === 'SPACE'
    ),
    [allBookings]
  );

  const stats = useMemo(() => ({
    total: allRentals.length,
    active: allRentals.filter((r: any) => r.status === 'ACTIVE' || r.status === 'CONFIRMED').length,
    completed: allRentals.filter((r: any) => r.status === 'COMPLETED' || r.status === 'RETURNED').length,
    pending: allRentals.filter((r: any) => r.status === 'PENDING' || r.status === 'RESERVED').length,
    cancelled: allRentals.filter((r: any) => r.status === 'CANCELLED').length,
    totalSpent: allRentals.reduce((sum: number, r: any) => sum + Number(r.price || r.totalAmount || 0), 0),
  }), [allRentals]);

  const filtered = useMemo(() => {
    let f = [...allRentals];
    switch (activeTab) {
      case 'active': f = f.filter((r: any) => ['ACTIVE', 'CONFIRMED'].includes(r.status)); break;
      case 'pending': f = f.filter((r: any) => ['PENDING', 'RESERVED'].includes(r.status)); break;
      case 'completed': f = f.filter((r: any) => ['COMPLETED', 'RETURNED'].includes(r.status)); break;
      case 'cancelled': f = f.filter((r: any) => r.status === 'CANCELLED'); break;
    }
    if (search) {
      const q = search.toLowerCase();
      f = f.filter((r: any) =>
        r.title?.toLowerCase().includes(q) ||
        r.businessName?.toLowerCase().includes(q) ||
        r.business?.toLowerCase().includes(q)
      );
    }
    return f;
  }, [allRentals, activeTab, search]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mes locations"
        description="Suivez toutes vos locations de véhicules, équipements et espaces"
        breadcrumbs={[{ label: 'Locations' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <Car className="h-5 w-5" />
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
              <p className="text-xs text-gray-500 dark:text-gray-400">En cours</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">À venir</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Terminées</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dépensé</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats.totalSpent.toLocaleString()} FCFA
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
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({tab.key === 'active' ? stats.active : tab.key === 'pending' ? stats.pending : tab.key === 'completed' ? stats.completed : stats.cancelled})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Car className="h-12 w-12" />}
          title="Aucune location"
          description={
            search
              ? 'Essayez une autre recherche'
              : "Vous n'avez pas encore effectué de location. Explorez les offres de location disponibles sur la marketplace."
          }
          action={
            <Link href="/dashboard/explore">
              <Button>Découvrir des locations</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((rental: any) => {
            const statusInfo = STATUS_CONFIG[rental.status] || { label: rental.status, variant: 'default' as const };
            const depositStatus = DEPOSIT_STATUS[rental.depositStatus] || null;
            const startDate = new Date(rental.startDate || rental.date);
            const endDate = rental.endDate ? new Date(rental.endDate) : null;
            const duration = endDate
              ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Link key={rental.id} href={`/dashboard/my-rentals/${rental.id}`}>
                <Card className="p-5 hover:shadow-md transition-all duration-200 group cursor-pointer">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/20 dark:to-emerald-900/20 flex items-center justify-center text-brand shrink-0">
                      <Car className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {rental.title || rental.businessName || 'Location'}
                            </h3>
                            <Badge variant={statusInfo.variant} size="xs">
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {rental.businessName || rental.business || 'Business'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {Number(rental.price || rental.totalAmount || 0).toLocaleString()} FCFA
                          </p>
                          {depositStatus && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Caution : <span className={cn('font-medium', depositStatus.variant === 'success' ? 'text-emerald-600' : 'text-amber-600')}>
                                {depositStatus.label}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {endDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {duration && (
                          <span className="flex items-center gap-1 text-brand font-medium">
                            {duration} jour{duration > 1 ? 's' : ''}
                          </span>
                        )}
                        {rental.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {rental.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0 mt-1" />
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
