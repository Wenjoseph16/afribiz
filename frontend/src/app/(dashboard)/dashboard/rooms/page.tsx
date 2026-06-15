'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BedDouble, Plus, Search, Grid3X3, List,
  Eye, Pencil, Star, Users, Building2, TrendingUp,
  ArrowUpDown, Loader, Zap, Lightbulb, AlertTriangle,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMyRooms, useRoomStats } from '@/features/hooks';

interface RoomItem {
  id: string; name: string; roomNumber?: string; type: string;
  price: number; capacity: number; status: string; rating: number;
  bookingCount: number; isActive: boolean; isPromotional: boolean; featured: boolean;
  createdAt?: string;
}

const isPopular = (r: RoomItem) => (r.bookingCount || 0) >= 10;
const isHighDemand = (r: RoomItem) => (r.bookingCount || 0) >= 5;
const isNewRoom = (r: RoomItem) => {
  if (!r.createdAt) return false;
  const age = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return age < 30;
};

function getBadges(room: RoomItem): { label: string; className: string }[] {
  const badges: { label: string; className: string }[] = [];
  if (room.isPromotional) badges.push({ label: 'PROMO', className: 'bg-red-100 text-red-700' });
  if (isPopular(room)) badges.push({ label: '🔥 Populaire', className: 'bg-emerald-100 text-emerald-700' });
  if (isHighDemand(room) && !isPopular(room)) badges.push({ label: '📈 Haute demande', className: 'bg-blue-100 text-blue-700' });
  if (isNewRoom(room)) badges.push({ label: '🆕 Nouveau', className: 'bg-purple-100 text-purple-700' });
  if (room.featured) badges.push({ label: '⭐ Vedette', className: 'bg-amber-100 text-amber-700' });
  return badges;
}

const ROOM_TYPES: Record<string, string> = {
  STANDARD: 'Standard', VIP: 'VIP', SUITE: 'Suite', STUDIO: 'Studio',
  APARTMENT: 'Appartement', VILLA: 'Villa', DORMITORY: 'Dortoir',
  FAMILY: 'Familiale', DOUBLE: 'Double', SINGLE: 'Single',
  DELUXE: 'Deluxe', BUNGALOW: 'Bungalow',
};

const ROOM_STATUS: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: 'Disponible', color: 'bg-emerald-500' },
  RESERVED: { label: 'Réservée', color: 'bg-blue-500' },
  OCCUPIED: { label: 'Occupée', color: 'bg-purple-500' },
  CLEANING: { label: 'Nettoyage', color: 'bg-amber-500' },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-orange-500' },
  CLOSED: { label: 'Fermée', color: 'bg-gray-500' },
  BLOCKED: { label: 'Bloquée', color: 'bg-red-500' },
};

const TABS = [
  { id: 'all' as const, label: 'Toutes' },
  { id: 'available' as const, label: 'Disponibles' },
  { id: 'occupied' as const, label: 'Occupées' },
  { id: 'maintenance' as const, label: 'Maintenance' },
  { id: 'inactive' as const, label: 'Inactives' },
];

const FMT = new Intl.NumberFormat('fr-FR');

export default function RoomsPage() {
  const { data: roomsData, isLoading, error, refetch } = useMyRooms();
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  const { data: statsData } = useRoomStats();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const allRooms: RoomItem[] = Array.isArray(roomsData) ? roomsData : (roomsData?.rooms || roomsData?.data || []);

  const stats = statsData || {
    total: allRooms.length,
    available: allRooms.filter(r => r.status === 'AVAILABLE' && r.isActive).length,
    bookings: allRooms.reduce((a, r) => a + (r.bookingCount || 0), 0),
    rate: allRooms.length > 0 ? Math.round((allRooms.filter(r => r.status === 'OCCUPIED').length / allRooms.length) * 100) : 0,
  };

  const updatedTabs = TABS.map(t => ({
    ...t,
    count: t.id === 'all' ? allRooms.length
      : t.id === 'available' ? allRooms.filter(r => r.status === 'AVAILABLE' && r.isActive).length
      : t.id === 'occupied' ? allRooms.filter(r => r.status === 'OCCUPIED').length
      : t.id === 'maintenance' ? allRooms.filter(r => r.status === 'MAINTENANCE' || r.status === 'CLEANING').length
      : allRooms.filter(r => !r.isActive).length,
  }));

  const suggestions = useMemo(() => {
    const items: {
      type: string; title: string; description: string; count: string;
      link: string; icon: React.ReactNode; bg: string; border: string; iconBg: string; countColor: string;
    }[] = [];
    const lowBookings = allRooms.filter(r => r.isActive && (r.bookingCount || 0) === 0);
    if (lowBookings.length > 0) {
      items.push({
        type: 'no_bookings', title: 'Chambres sans réservation',
        description: 'Ces chambres n\'ont jamais été réservées. Essayez une promotion.',
        count: `${lowBookings.length}`, link: '#',
        icon: <Lightbulb className="h-5 w-5 text-blue-600" />,
        bg: '#eff6ff', border: '#bfdbfe', iconBg: '#dbeafe', countColor: '#2563eb',
      });
    }
    const popular = allRooms.filter(r => r.isActive && isPopular(r));
    if (popular.length > 0) {
      items.push({
        type: 'popular', title: 'Chambres populaires',
        description: `Génèrent le plus de réservations. Mettez-les en avant.`,
        count: `${popular.length}`, link: '#',
        icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
        bg: '#ecfdf5', border: '#a7f3d0', iconBg: '#d1fae5', countColor: '#059669',
      });
    }
    const inactive = allRooms.filter(r => !r.isActive);
    if (inactive.length > 0) {
      items.push({
        type: 'inactive', title: 'Chambres inactives',
        description: 'Ces chambres ne sont pas visibles publiquement.',
        count: `${inactive.length}`, link: '#',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        bg: '#fffbeb', border: '#fde68a', iconBg: '#fef3c7', countColor: '#d97706',
      });
    }
    const promos = allRooms.filter(r => r.isPromotional);
    if (promos.length > 0) {
      items.push({
        type: 'promo', title: 'Promotions actives',
        description: 'Chambres avec un prix promotionnel en cours.',
        count: `${promos.length}`, link: '#',
        icon: <Zap className="h-5 w-5 text-purple-600" />,
        bg: '#f5f3ff', border: '#ddd6fe', iconBg: '#ede9fe', countColor: '#7c3aed',
      });
    }
    return items;
  }, [allRooms]);

  const filtered = useMemo(() => {
    let f = [...allRooms];
    if (activeTab === 'available') f = f.filter(r => r.status === 'AVAILABLE' && r.isActive);
    else if (activeTab === 'occupied') f = f.filter(r => r.status === 'OCCUPIED');
    else if (activeTab === 'maintenance') f = f.filter(r => r.status === 'MAINTENANCE' || r.status === 'CLEANING');
    else if (activeTab === 'inactive') f = f.filter(r => !r.isActive);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(r => r.name.toLowerCase().includes(q) || r.roomNumber?.toLowerCase().includes(q) || ROOM_TYPES[r.type]?.toLowerCase().includes(q));
    }
    f.sort((a, b) => {
      const d = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'price') return (a.price - b.price) * d;
      if (sortBy === 'capacity') return (a.capacity - b.capacity) * d;
      if (sortBy === 'popular') return (a.bookingCount - b.bookingCount) * d;
      return a.name.localeCompare(b.name) * d;
    });
    return f;
  }, [allRooms, activeTab, searchQuery, sortBy, sortOrder]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Logements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos chambres et hébergements</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/rooms/planning"><Button variant="outline" size="sm">Planning</Button></Link>
          <Link href="/dashboard/rooms/new"><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvelle chambre</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard icon={<BedDouble className="h-5 w-5" />} iconBg="bg-brand/10" iconColor="text-brand" label="Total" value={stats.total || allRooms.length} />
        <StatsCard icon={<Building2 className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Disponibles" value={stats.available} />
        <StatsCard icon={<Users className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Réservations" value={stats.bookings} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Taux occup." value={`${stats.rate}%`} />
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {updatedTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', activeTab === tab.id ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>
              {tab.label}<span className={cn('text-xs px-1.5 py-0.5 rounded-full', activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400')}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
          <div className="flex items-center gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
              <option value="name">Nom</option><option value="price">Prix</option><option value="capacity">Capacité</option>
            </select>
            <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"><ArrowUpDown className={cn('h-4 w-4 text-gray-500', sortOrder === 'desc' && 'rotate-180')} /></button>
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={cn('p-2', viewMode === 'grid' ? 'bg-brand text-white' : 'hover:bg-gray-50 text-gray-500')}><Grid3X3 className="h-4 w-4" /></button>
              <button onClick={() => setViewMode('list')} className={cn('p-2', viewMode === 'list' ? 'bg-brand text-white' : 'hover:bg-gray-50 text-gray-500')}><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <BedDouble className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune chambre trouvée</h3>
          <Link href="/dashboard/rooms/new"><Button><Plus className="h-4 w-4 mr-1.5" />Ajouter une chambre</Button></Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r => <RoomCard key={r.id} room={r} />)}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Chambre</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Prix</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Capacité</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Réserv.</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="p-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(r => <RoomRow key={r.id} room={r} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RoomCard({ room }: { room: RoomItem }) {
  const status = ROOM_STATUS[room.status] || { label: room.status, color: 'bg-gray-400' };
  const badges = getBadges(room);
  return (
    <Link href={`/dashboard/rooms/${room.id}`} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all">
      <div className="aspect-[4/3] bg-gradient-to-br from-brand/5 to-blue-50 dark:from-brand/10 dark:to-blue-900/10 flex flex-col items-center justify-center relative">
        <BedDouble className="h-12 w-12 text-brand/30" />
        {room.roomNumber && <span className="text-xs font-mono text-gray-400">N° {room.roomNumber}</span>}
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {badges.map((b, i) => (
              <span key={i} className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${b.className}`}>{b.label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 truncate">{room.name}</h3>
          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-1', status.color)} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{ROOM_TYPES[room.type] || room.type} · {room.capacity} pers.</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold">{(room.price || 0).toLocaleString()} FCFA</p>
          <div className="flex items-center gap-1 text-xs text-amber-500"><Star className="h-3 w-3 fill-amber-400" />{room.rating || '-'}</div>
        </div>
      </div>
    </Link>
  );
}

function RoomRow({ room }: { room: RoomItem }) {
  const status = ROOM_STATUS[room.status] || { label: room.status, color: 'bg-gray-400' };
  const badges = getBadges(room);
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
      <td className="p-4">
        <Link href={`/dashboard/rooms/${room.id}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center shrink-0"><BedDouble className="h-5 w-5 text-brand" /></div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{room.name}</p>
            <p className="text-xs text-gray-500">
              {room.roomNumber ? `N° ${room.roomNumber} · ` : ''}{room.rating || '-'} ★
            </p>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {badges.map((b, i) => (
                  <span key={i} className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${b.className}`}>{b.label}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
      </td>
      <td className="p-4 text-sm text-gray-600">{ROOM_TYPES[room.type] || room.type}</td>
      <td className="p-4 text-right text-sm font-semibold">{(room.price || 0).toLocaleString()} FCFA</td>
      <td className="p-4 text-right text-sm text-gray-600">{room.capacity} pers.</td>
      <td className="p-4 text-right text-sm text-gray-600">{room.bookingCount || 0}</td>
      <td className="p-4 text-right">
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', room.isActive ? 'text-gray-700' : 'text-gray-400')}>
          <span className={cn('w-2 h-2 rounded-full', status.color)} />{status.label}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <Link href={`/dashboard/rooms/${room.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand"><Eye className="h-4 w-4" /></Link>
          <Link href={`/dashboard/rooms/${room.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500"><Pencil className="h-4 w-4" /></Link>
        </div>
      </td>
    </tr>
  );
}
