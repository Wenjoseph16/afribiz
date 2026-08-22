'use client';

import Image from 'next/image';
import { Room } from '@/types/business';
import {
  Bed,
  Users,
  Wifi,
  Snowflake,
  Tv,
  Bath,
  Calendar,
  Star,
  Clock,
  Coffee,
  Ruler,
  BadgePercent,
  MessageCircle,
  Car,
} from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { useLayawayOffers, LayawayButton, LayawayBadge } from '../useLayaway';
import { SectionHeader } from '../ui/SectionHeader';
import { useStaggerReveal, revealClasses, revealDelay } from '../ui/reveal';

interface RoomsProps {
  rooms: Room[];
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  VIP: 'VIP',
  SUITE: 'Suite',
  STUDIO: 'Studio',
  APARTMENT: 'Appartement',
  VILLA: 'Villa',
  DORMITORY: 'Dortoir',
  FAMILY: 'Familiale',
  DOUBLE: 'Double',
  SINGLE: 'Single',
  DELUXE: 'Deluxe',
  BUNGALOW: 'Bungalow',
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  climatisation: <Snowflake className="w-3.5 h-3.5" />,
  tv: <Tv className="w-3.5 h-3.5" />,
  télévision: <Tv className="w-3.5 h-3.5" />,
  'salle de bain': <Bath className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  'petit déjeuner': <Coffee className="w-3.5 h-3.5" />,
};

const STATUS_STYLES: Record<string, { label: string; dot: string }> = {
  AVAILABLE: { label: 'Disponible', dot: 'bg-emerald-500' },
  RESERVED: { label: 'Réservée', dot: 'bg-blue-500' },
  OCCUPIED: { label: 'Occupée', dot: 'bg-purple-500' },
};

export function Rooms({ rooms }: RoomsProps) {
  const stagger = useStaggerReveal(rooms?.length || 0);
  if (!rooms?.length) return null;

  // Badge 🔒 Épargne — offres actives sur les chambres (1 seul appel)
  const roomIds = rooms.map((r) => r.id);
  const { data: layawayMap } = useLayawayOffers('ROOM', roomIds);

  return (
    <section id="section-rooms" className="scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <SectionHeader eyebrow="Hébergement" title="Nos Logements" count={rooms.length} />

        <div ref={stagger.ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {rooms.map((room, idx) => (
            <div
              key={room.id}
              className={cn('group relative', revealClasses(stagger.visible, idx))}
              style={revealDelay(idx)}
            >
              <RoomCard
                room={room}
                hasLayaway={!!(layawayMap || {})[room.id]}
                layawayOffer={(layawayMap || {})[room.id]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoomCard({
  room,
  hasLayaway,
  layawayOffer,
}: {
  room: Room;
  hasLayaway?: boolean;
  layawayOffer?: { id: string };
}) {
  const fmtPrice = (p: number) => formatPrice(p, room.currency);
  const typeLabel = room.type ? ROOM_TYPE_LABELS[room.type] || room.type : null;
  const statusStyle = room.status ? STATUS_STYLES[room.status] : null;
  const hasPromo = room.isPromotional && room.promotionalPrice;

  return (
    <div className="p-[1px] rounded-[1.25rem] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 h-full biz-card">
      <div className="bg-white rounded-[calc(1.25rem-1px)] overflow-hidden h-full flex flex-col">
        {/* Image Zone */}
        <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
          {room.images?.[0] ? (
            <Image
              src={room.images[0]}
              alt={room.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60">
              <Bed className="w-12 h-12 text-brand-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {room.featured && (
              <span className="px-2 py-1 text-[10px] font-bold bg-amber-400/90 text-amber-900 rounded-full backdrop-blur-sm">
                ★ Vedette
              </span>
            )}
            {typeLabel && (
              <span className="px-2 py-1 text-[10px] font-semibold bg-white/85 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 rounded-full backdrop-blur-sm">
                {typeLabel}
              </span>
            )}
            {hasPromo && (
              <span className="px-2 py-1 text-[10px] font-bold bg-red-500/90 text-white rounded-full backdrop-blur-sm flex items-center gap-0.5">
                <BadgePercent className="w-2.5 h-2.5" /> Promo
              </span>
            )}
            <LayawayBadge active={hasLayaway} />
          </div>

          {/* Availability pill */}
          <div className="absolute bottom-3 left-3">
            {statusStyle ? (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/90 dark:bg-gray-900/90 rounded-full text-[10px] font-medium backdrop-blur-md shadow-sm">
                <span className={cn('w-1.5 h-1.5 rounded-full', statusStyle.dot)} />
                {statusStyle.label}
              </span>
            ) : (
              <span
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md shadow-sm',
                  room.isAvailable ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {room.isAvailable ? 'Disponible' : 'Indisponible'}
              </span>
            )}
          </div>

          {/* Rating */}
          {room.rating && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-gray-900">{room.rating}</span>
            </div>
          )}
        </div>

        {/* Content Zone */}
        <div className="p-4 md:p-5 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-[15px] leading-tight line-clamp-1 mb-1">
            {room.name}
            {room.roomNumber && (
              <span className="ml-2 text-[10px] font-mono font-medium text-gray-300">
                N°{room.roomNumber}
              </span>
            )}
          </h3>

          {(room.shortDescription || room.description) && (
            <p className="text-[13px] text-gray-400 line-clamp-2 leading-relaxed mb-3">
              {room.shortDescription || room.description}
            </p>
          )}

          {/* Capacity, beds, size */}
          <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mb-2.5">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-300" /> {room.capacity} pers.
            </span>
            {room.beds && (
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-gray-300" /> {room.beds} lit
                {room.beds > 1 ? 's' : ''}
              </span>
            )}
            {room.size && (
              <span className="flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-gray-300" /> {room.size}m²
              </span>
            )}
          </div>

          {/* Amenities */}
          {room.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {room.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="flex items-center gap-0.5 text-[10px] bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md border border-gray-100 dark:border-gray-700"
                >
                  {AMENITY_ICONS[amenity.toLowerCase()] || null}
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 4 && (
                <span className="text-[10px] text-brand-600 font-medium px-1 py-0.5">
                  +{room.amenities.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Breakfast & check-in */}
          <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-400">
            {room.breakfastIncluded && (
              <span className="flex items-center gap-1">
                <Coffee className="w-3 h-3" /> Petit-déjeuner inclus
              </span>
            )}
            {room.checkInTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Check-in {room.checkInTime}
              </span>
            )}
          </div>

          {/* Pricing + CTA */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-50 mt-auto">
            <div>
              <div className="flex items-baseline gap-1.5">
                {hasPromo ? (
                  <>
                    <span className="text-xl font-bold text-red-500 tracking-tight">
                      {fmtPrice(room.promotionalPrice!)}
                    </span>
                    <span className="text-xs text-gray-300 line-through">
                      {fmtPrice(room.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-gray-900 tracking-tight">
                    {fmtPrice(room.price)}
                  </span>
                )}
                <span className="text-[10px] text-gray-400">/nuit</span>
              </div>
              {room.priceWeekend && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Week-end: {fmtPrice(room.priceWeekend)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button className="flex items-center gap-1 w-8 h-8 justify-center rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors active:scale-[0.95]">
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-[12px] font-semibold rounded-full hover:bg-gray-800 shadow-lg shadow-gray-900/10 transition-all duration-300 active:scale-[0.97]">
                <Calendar className="w-3.5 h-3.5" /> Réserver
              </button>
              <LayawayButton offer={layawayOffer} itemId={room.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
