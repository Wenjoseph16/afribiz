'use client';

import Image from 'next/image';
import { Room } from '@/types/business';
import {
  Bed, Users, Wifi, Snowflake, Tv, Bath, Calendar,
  Star, Clock, Coffee, Ruler, ChevronRight, BadgePercent,
  MessageCircle, Car,
} from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface RoomsProps {
  rooms: Room[];
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  STANDARD: 'Standard', VIP: 'VIP', SUITE: 'Suite', STUDIO: 'Studio',
  APARTMENT: 'Appartement', VILLA: 'Villa', DORMITORY: 'Dortoir',
  FAMILY: 'Familiale', DOUBLE: 'Double', SINGLE: 'Single',
  DELUXE: 'Deluxe', BUNGALOW: 'Bungalow',
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  climatisation: <Snowflake className="w-3.5 h-3.5" />,
  tv: <Tv className="w-3.5 h-3.5" />,
  télévision: <Tv className="w-3.5 h-3.5" />,
  'salle de bain': <Bath className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  'petit d\u00e9jeuner': <Coffee className="w-3.5 h-3.5" />,
};

const STATUS_STYLES: Record<string, { label: string; dot: string }> = {
  AVAILABLE: { label: 'Disponible', dot: 'bg-emerald-500' },
  RESERVED: { label: 'Réservée', dot: 'bg-blue-500' },
  OCCUPIED: { label: 'Occupée', dot: 'bg-purple-500' },
};

export function Rooms({ rooms }: RoomsProps) {
  if (!rooms?.length) return null;

  return (
    <section id="section-rooms" className="scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Nos Logements</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {rooms.length} {rooms.length > 1 ? 'hébergements' : 'hébergement'} disponibles
            </p>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-sm text-brand font-medium">
            Voir tout <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        {rooms.length > 3 && (
          <div className="mt-8 text-center sm:hidden">
            <button className="inline-flex items-center gap-1 px-4 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors">
              Voir tous les logements <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function RoomCard({ room }: { room: Room }) {
  const fmtPrice = (p: number) => formatPrice(p, room.currency);
  const typeLabel = room.type ? ROOM_TYPE_LABELS[room.type] || room.type : null;
  const statusStyle = room.status ? STATUS_STYLES[room.status] : null;
  const hasPromo = room.isPromotional && room.promotionalPrice;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-brand/20 transition-all duration-200">
      {/* Image */}
      <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {room.images?.[0] ? (
          <Image src={room.images[0]} alt={room.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <Bed className="w-16 h-16" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {room.featured && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-amber-900 rounded-full shadow-sm">
              Vedette
            </span>
          )}
          {typeLabel && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 rounded-full backdrop-blur-sm">
              {typeLabel}
            </span>
          )}
          {hasPromo && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full shadow-sm flex items-center gap-0.5">
              <BadgePercent className="w-2.5 h-2.5" /> Promo
            </span>
          )}
        </div>

        {/* Room number */}
        {room.roomNumber && (
          <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-mono bg-black/40 text-white rounded-full backdrop-blur-sm">
            N° {room.roomNumber}
          </div>
        )}

        {/* Availability indicator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          {statusStyle ? (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-white/90 dark:bg-gray-900/90 rounded-full text-[10px] font-medium backdrop-blur-sm">
              <span className={cn('w-1.5 h-1.5 rounded-full', statusStyle.dot)} />
              {statusStyle.label}
            </span>
          ) : (
            <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm', room.isAvailable ? 'bg-emerald-50/90 text-emerald-700' : 'bg-red-50/90 text-red-600')}>
              <span className={cn('w-1.5 h-1.5 rounded-full', room.isAvailable ? 'bg-emerald-500' : 'bg-red-500')} />
              {room.isAvailable ? 'Disponible' : 'Indisponible'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{room.name}</h3>
          {room.rating && (
            <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{room.rating}</span>
            </div>
          )}
        </div>

        {room.shortDescription && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{room.shortDescription}</p>
        )}
        {!room.shortDescription && room.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{room.description}</p>
        )}

        {/* Capacity, beds, size */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {room.capacity} pers.</span>
          {room.beds && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {room.beds} lit{room.beds > 1 ? 's' : ''}</span>}
          {room.size && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> {room.size}m²</span>}
        </div>

        {/* Amenities */}
        {room.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {room.amenities.slice(0, 5).map((amenity) => (
              <span key={amenity} className="flex items-center gap-0.5 text-[10px] bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md border border-gray-100 dark:border-gray-700">
                {AMENITY_ICONS[amenity.toLowerCase()] || null}
                {amenity}
              </span>
            ))}
            {room.amenities.length > 5 && (
              <span className="text-[10px] text-gray-400 px-1.5 py-0.5">+{room.amenities.length - 5}</span>
            )}
          </div>
        )}

        {/* Breakfast & check-in/out */}
        <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-400">
          {room.breakfastIncluded && (
            <span className="flex items-center gap-1"><Coffee className="w-3 h-3" /> Petit-déjeuner inclus</span>
          )}
          {room.checkInTime && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Check-in {room.checkInTime}</span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-end justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <div className="flex items-baseline gap-1.5">
              {hasPromo ? (
                <>
                  <span className="text-lg font-bold text-red-500">{fmtPrice(room.promotionalPrice!)}</span>
                  <span className="text-xs text-gray-400 line-through">{fmtPrice(room.price)}</span>
                </>
              ) : (
                <span className="text-lg font-bold text-brand">{fmtPrice(room.price)}</span>
              )}
              <span className="text-[10px] text-gray-400">/nuit</span>
            </div>
            {room.priceWeekend && (
              <p className="text-[10px] text-gray-400 mt-0.5">Week-end: {fmtPrice(room.priceWeekend)}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors shadow-sm">
              <MessageCircle className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors shadow-sm">
              <Calendar className="w-3 h-3" /> Réserver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
