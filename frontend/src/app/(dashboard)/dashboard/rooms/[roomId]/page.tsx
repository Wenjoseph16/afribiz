'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, BedDouble, Loader,
  Trash2, Copy, EyeOff, Eye, BarChart3, Calendar, Bath,
  Wifi, Clock, Dumbbell, Car,
  UtensilsCrossed, Tv, Wind, History, TrendingUp,
  Activity, Star,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useMyRoom, useDeleteRoom, useToggleRoomActive, useDuplicateRoom } from '@/features/hooks';

const ROOM_TYPES: Record<string, string> = {
  STANDARD: 'Standard', VIP: 'VIP', SUITE: 'Suite', STUDIO: 'Studio',
  APARTMENT: 'Appartement', VILLA: 'Villa', DORMITORY: 'Dortoir',
  FAMILY: 'Familiale', DOUBLE: 'Double', SINGLE: 'Single',
  DELUXE: 'Deluxe', BUNGALOW: 'Bungalow',
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-4 w-4" />,
  Climatisation: <Wind className="h-4 w-4" />,
  Télévision: <Tv className="h-4 w-4" />,
  Parking: <Car className="h-4 w-4" />,
  'Salle de sport': <Dumbbell className="h-4 w-4" />,
  Restaurant: <UtensilsCrossed className="h-4 w-4" />,
};

function isPopularRoom(r: any) { return (r._count?.bookings || 0) >= 10; }
function isHighDemandRoom(r: any) { return (r._count?.bookings || 0) >= 5; }
function isNewRoom(r: any) {
  if (!r.createdAt) return false;
  const age = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return age < 30;
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;
  const { data: r, isLoading, refetch } = useMyRoom(roomId);
  const deleteRoom = useDeleteRoom();
  const toggleActive = useToggleRoomActive();
  const duplicate = useDuplicateRoom();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'stats' | 'history'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteRoom.mutateAsync(roomId);
    router.push('/dashboard/rooms');
  };

  const handleToggle = async () => {
    await toggleActive.mutateAsync(roomId);
    refetch();
  };

  const handleDuplicate = async () => {
    await duplicate.mutateAsync(roomId);
    router.push('/dashboard/rooms');
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!r) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Chambre non trouvée</p></div>;

  const fmtPrice = (p: number) => (p || 0).toLocaleString() + ' FCFA';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/rooms" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{r.name}</h1>
              {r.roomNumber && <span className="text-sm text-gray-400 font-mono">N° {r.roomNumber}</span>}
              <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full', r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                {r.isActive ? 'Actif' : 'Inactif'}
              </span>
              {r.isPromotional && <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">PROMO</span>}
              {r.featured && <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-600 rounded-full">VEDETTE</span>}
              {isPopularRoom(r) && <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full">🔥 Populaire</span>}
              {isHighDemandRoom(r) && !isPopularRoom(r) && <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">📈 Haute demande</span>}
              {isNewRoom(r) && <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">🆕 Nouveau</span>}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {ROOM_TYPES[r.type] || r.type} · {r.capacity} pers. · {r.beds} lit(s) · {r.bathroom === 'PRIVATE' ? 'SDB privée' : r.bathroom === 'SHARED' ? 'SDB partagée' : 'SDB commune'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleToggle} isLoading={toggleActive.isPending}>
            {r.isActive ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
            {r.isActive ? 'Désactiver' : 'Activer'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDuplicate} isLoading={duplicate.isPending}>
            <Copy className="h-4 w-4 mr-1.5" />Dupliquer
          </Button>
          <Link href={`/dashboard/rooms/${roomId}/edit`}>
            <Button size="sm"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fmtPrice(r.price)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Par nuit
            {r.isPromotional && r.promotionalPrice && <span className="text-red-500 ml-1">→ {fmtPrice(r.promotionalPrice)}</span>}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-brand">{r.capacity}</p>
          <p className="text-xs text-gray-500 mt-0.5">Capacité max · {r.beds} lit(s)</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-blue-600">{r._count?.bookings || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Réservations</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-amber-500">{r.rating || '-'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Note</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview' as const, label: 'Aperçu', icon: <BedDouble className="h-4 w-4" /> },
            { id: 'bookings' as const, label: 'Réservations', icon: <Calendar className="h-4 w-4" /> },
            { id: 'stats' as const, label: 'Statistiques', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'history' as const, label: 'Historique', icon: <History className="h-4 w-4" /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-1.5 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {r.shortDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Description courte</h4>
                  <p className="text-sm text-gray-600">{r.shortDescription}</p>
                </div>
              )}
              {r.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Description complète</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{r.description}</p>
                </div>
              )}

              {/* Prix saisonniers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {r.priceWeekend && <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-xs text-gray-500">Week-end</p><p className="text-sm font-semibold mt-0.5">{fmtPrice(r.priceWeekend)}</p></div>}
                {r.priceHighSeason && <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-xs text-gray-500">Haute saison</p><p className="text-sm font-semibold mt-0.5">{fmtPrice(r.priceHighSeason)}</p></div>}
                {r.priceLowSeason && <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-xs text-gray-500">Basse saison</p><p className="text-sm font-semibold mt-0.5">{fmtPrice(r.priceLowSeason)}</p></div>}
                {r.size && <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-xs text-gray-500">Surface</p><p className="text-sm font-semibold mt-0.5">{r.size} m²</p></div>}
              </div>

              {/* Infos pratiques */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-xs text-gray-500"><Clock className="h-3 w-3 inline mr-1" />Check-in</p><p className="text-sm font-semibold mt-0.5">{r.checkInTime || '14:00'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-xs text-gray-500"><Clock className="h-3 w-3 inline mr-1" />Check-out</p><p className="text-sm font-semibold mt-0.5">{r.checkOutTime || '12:00'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-xs text-gray-500"><Bath className="h-3 w-3 inline mr-1" />Salle de bain</p><p className="text-sm font-semibold mt-0.5">{r.bathroom === 'PRIVATE' ? 'Privée' : r.bathroom === 'SHARED' ? 'Partagée' : 'Commune'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-xs text-gray-500">Petit-déjeuner</p><p className="text-sm font-semibold mt-0.5">{r.breakfastIncluded ? 'Inclus ✓' : 'Non inclus'}</p></div>
              </div>

              {/* Équipements */}
              {r.amenities?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Équipements</h4>
                  <div className="flex flex-wrap gap-2">
                    {r.amenities.map((a: string) => (
                      <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                        {AMENITY_ICONS[a] || null}{a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(r.seoTitle || r.seoDescription) && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100">
                  <h4 className="text-xs font-semibold text-blue-600 mb-2">SEO</h4>
                  {r.seoTitle && <p className="text-sm text-gray-700"><span className="text-gray-400">Titre:</span> {r.seoTitle}</p>}
                  {r.seoDescription && <p className="text-sm text-gray-700 mt-0.5"><span className="text-gray-400">Description:</span> {r.seoDescription}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Réservations pour cette chambre</p>
              <p className="text-xs text-gray-400 mt-1">{r._count?.bookings || 0} réservation(s) au total</p>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-brand/5 rounded-xl"><p className="text-2xl font-bold text-brand">{r._count?.bookings || 0}</p><p className="text-xs text-gray-500 mt-0.5">Réservations</p></div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl"><p className="text-2xl font-bold text-emerald-600">{r.rating || '-'}</p><p className="text-xs text-gray-500 mt-0.5">Note</p></div>
              <div className="text-center p-4 bg-amber-50 rounded-xl"><p className="text-2xl font-bold text-amber-600">{r.capacity}</p><p className="text-xs text-gray-500 mt-0.5">Capacité</p></div>
              <div className="text-center p-4 bg-blue-50 rounded-xl"><p className="text-2xl font-bold text-blue-600">{r.beds}</p><p className="text-xs text-gray-500 mt-0.5">Lits</p></div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" />Création</p>
                  <p className="text-sm font-semibold mt-1 text-gray-900 dark:text-gray-100">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Activity className="h-3 w-3" />Dernière modif.</p>
                  <p className="text-sm font-semibold mt-1 text-gray-900 dark:text-gray-100">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" />Performance</p>
                  <p className="text-sm font-semibold mt-1 text-gray-900 dark:text-gray-100">
                    {(r._count?.bookings || 0)} réservations
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Star className="h-3 w-3" />Note moyenne</p>
                  <p className="text-sm font-semibold mt-1 text-gray-900 dark:text-gray-100">
                    {r.rating || '-'} / 5
                  </p>
                </div>
              </div>
              {r.createdAt && (
                <div className="p-4 bg-brand/5 rounded-xl border border-brand/10">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Âge du logement</h4>
                  <p className="text-sm text-gray-600">
                    Publié depuis {Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))} jours
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-500" /></div>
              <div><h2 className="text-lg font-bold">Supprimer cette chambre ?</h2><p className="text-sm text-gray-500">Action irréversible</p></div>
            </div>
            <p className="text-sm text-gray-600 mb-6">La chambre <strong>{r.name}</strong> sera supprimée définitivement.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
              <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
