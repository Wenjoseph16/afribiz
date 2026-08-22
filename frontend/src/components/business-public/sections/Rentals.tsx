'use client';

import Image from 'next/image';
import { Rental } from '@/types/business';
import { Package, Calendar, Shield, FileText } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { useLayawayOffers, LayawayButton, LayawayBadge } from '../useLayaway';
import { SectionHeader } from '../ui/SectionHeader';
import { useStaggerReveal, revealClasses, revealDelay } from '../ui/reveal';

interface RentalsProps {
  rentals: Rental[];
}

export function Rentals({ rentals }: RentalsProps) {
  const stagger = useStaggerReveal(rentals?.length || 0);
  if (!rentals?.length) return null;

  // Badge 🔒 Épargne — offres actives sur les locations (1 seul appel)
  const rentalIds = rentals.map((r) => r.id);
  const { data: layawayMap } = useLayawayOffers('RENTAL', rentalIds);

  return (
    <section id="section-rentals" className="scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <SectionHeader eyebrow="Location" title="Locations" count={rentals.length} />

        <div ref={stagger.ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {rentals.map((rental, idx) => (
            <div
              key={rental.id}
              className={cn('group relative', revealClasses(stagger.visible, idx))}
              style={revealDelay(idx)}
            >
              <div className="p-[1px] rounded-[1.25rem] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 h-full biz-card">
                <div className="bg-white rounded-[calc(1.25rem-1px)] overflow-hidden h-full flex flex-col">
                  {/* Image Zone */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    {rental.images?.[0] ? (
                      <Image
                        src={rental.images[0]}
                        alt={rental.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60">
                        <Package className="w-10 h-10 text-brand-300" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <LayawayBadge active={!!(layawayMap || {})[rental.id]} />
                    </div>

                    {/* Availability pill */}
                    <span
                      className={cn(
                        'absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold rounded-full backdrop-blur-md',
                        rental.isAvailable
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-red-500/90 text-white'
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {rental.isAvailable
                        ? `Disponible${rental.quantity > 1 ? ` (${rental.quantity})` : ''}`
                        : 'Indisponible'}
                    </span>
                  </div>

                  {/* Content Zone */}
                  <div className="p-4 md:p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 text-[15px] leading-tight mb-1 line-clamp-1">
                      {rental.name}
                    </h3>
                    {rental.description && (
                      <p className="text-[13px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                        {rental.description}
                      </p>
                    )}

                    {/* Tarifs */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2.5 py-1.5 rounded-lg bg-brand-50 border border-brand-100 text-[12px] font-bold text-brand-700">
                        {formatPrice(Number(rental.price), rental.currency)}
                        <span className="font-medium text-brand-600/70">/{rental.unit}</span>
                      </span>
                      {rental.weeklyPrice != null && (
                        <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[12px] font-semibold text-gray-600">
                          {formatPrice(Number(rental.weeklyPrice), rental.currency)}
                          <span className="font-medium text-gray-400">/sem</span>
                        </span>
                      )}
                      {rental.deposit != null && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[12px] text-gray-500">
                          <Shield className="w-3 h-3" />
                          Caution {formatPrice(Number(rental.deposit), rental.currency)}
                        </span>
                      )}
                    </div>

                    {rental.conditions && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-3 line-clamp-2">
                      <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{rental.conditions}</span>
                    </div>
                    )}

                    {/* Footer */}
                    <div className="pt-3 border-t border-gray-50 mt-auto">
                      <button
                        disabled={!rental.isAvailable}
                        className={cn(
                          'w-full flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-full transition-all duration-300 active:scale-[0.97]',
                          rental.isAvailable
                            ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        <Calendar className="w-3.5 h-3.5" /> Réserver
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
