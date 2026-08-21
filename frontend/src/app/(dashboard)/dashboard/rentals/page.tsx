'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Plus,
  Search,
  Eye,
  Pencil,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  Loader,
  AlertTriangle,
  Zap,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import Image from 'next/image';
import { useMyRentals, useRentalStats } from '@/features/hooks';
import { ErrorState } from '@/components/ui/ErrorState';

interface RentalItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  deposit: number | null;
  priceUnit: string;
  currency: string;
  images: string[];
  quantity: number;
  availableQty: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}
function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('glass rounded-2xl glass-hover', className)}>{children}</div>;
}

export default function RentalsPage() {
  const { data: rentalsData, isLoading, error, refetch } = useMyRentals();
  const { data: statsData } = useRentalStats();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');

  const allRentals: RentalItem[] = Array.isArray(rentalsData)
    ? rentalsData
    : rentalsData?.rentals || rentalsData?.data || [];

  const stats = statsData || {
    total: allRentals.length,
    active: allRentals.filter((r) => r.isActive).length,
    inactive: allRentals.filter((r) => !r.isActive).length,
  };

  const filtered = useMemo(() => {
    let f = [...allRentals];
    if (activeTab === 'active') f = f.filter((r) => r.isActive);
    if (activeTab === 'inactive') f = f.filter((r) => !r.isActive);
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(
        (r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
      );
    }
    return f;
  }, [allRentals, activeTab, search]);

  if (error) {
    const status = (error as any)?.response?.status;
    if (status === 403) {
      return (
        <div className="space-y-6 max-w-7xl mx-auto">
          <GlassCard>
            <div className="text-center py-14">
              <Sparkles className="w-12 h-12 text-gray-300 dark:text-white/15 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Module Locations non activé
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/40 mb-5 max-w-md mx-auto">
                Activez ce module pour mettre vos articles en location.
              </p>
              <Link href="/dashboard/modules-analysis">
                <button className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl hover:bg-emerald-500/20 transition-all">
                  <Sparkles className="w-4 h-4 inline mr-1.5" /> Voir mes modules
                </button>
              </Link>
            </div>
          </GlassCard>
        </div>
      );
    }
    return (
      <ErrorState
        message={(error as any)?.response?.data?.error || error.message}
        onRetry={refetch}
      />
    );
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-3">
            <Car className="w-3 h-3" />
            Locations
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
            Articles en location
          </h1>
          <p className="text-gray-400 dark:text-white/30 text-sm mt-0.5">
            {stats.total} article{stats.total > 1 ? 's' : ''} — {stats.active} disponible
            {stats.active > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/rentals/new">
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white text-sm font-bold rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Nouvel article
          </button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: 'emerald' },
          { label: 'Disponibles', value: stats.active, icon: CheckCircle2, color: 'blue' },
          { label: 'Indisponibles', value: stats.inactive, icon: XCircle, color: 'amber' },
        ].map((kpi) => (
          <GlassCard key={kpi.label}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center border',
                  `bg-${kpi.color}-500/10 border-${kpi.color}-500/20`
                )}
              >
                <kpi.icon className={cn('w-4 h-4', `text-${kpi.color}-400`)} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {kpi.value}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-white/30 font-medium">
                  {kpi.label}
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-1 overflow-x-auto flex-1">
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200',
                activeTab === tab
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40 border border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:border-white/15'
              )}
            >
              {tab === 'all' ? 'Tous' : tab === 'active' ? 'Disponibles' : 'Indisponibles'}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/20" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-white/20 focus:border-emerald-500/40 focus:ring-0 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <Car className="w-12 h-12 text-gray-300 dark:text-white/15 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-white/40 mb-4">Aucun article trouvé</p>
            <Link href="/dashboard/rentals/new">
              <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl hover:bg-emerald-500/20 transition-all">
                <Plus className="w-4 h-4" /> Ajouter un article
              </button>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((rental, idx) => (
            <motion.div
              key={rental.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                href={`/dashboard/rentals/${rental.id}`}
                className="group block relative rounded-2xl glass p-1.5 hover:border-emerald-500/20 transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-36 rounded-[calc(1rem-0.1875rem)] bg-gradient-to-br from-emerald-500/5 to-transparent overflow-hidden">
                  {rental.images?.[0] ? (
                    <Image
                      src={rental.images[0]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-10 h-10 text-gray-900 dark:text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <span
                    className={cn(
                      'absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      rental.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40 border-gray-200 dark:border-white/10'
                    )}
                  >
                    {rental.isActive ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>

                <div className="relative rounded-[calc(1rem-0.1875rem)] p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mb-2">
                    {rental.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/40 mb-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-semibold text-emerald-400">
                      {formatPrice(rental.price, rental.currency)}
                    </span>
                    <span>/ {rental.priceUnit}</span>
                  </div>
                  {rental.deposit && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-white/30 mb-2">
                      <Package className="w-3 h-3" />
                      Caution : {formatPrice(rental.deposit, rental.currency)}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-xs text-gray-400 dark:text-white/30">
                      {rental.availableQty}/{rental.quantity} dispo.
                    </span>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-gray-400 dark:text-white/20 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
