'use client';

import Image from 'next/image';
import { BusinessEvent } from '@/types/business';
import { CalendarRange, MapPin, Users, Ticket } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { useLayawayOffers, LayawayButton, LayawayBadge } from '../useLayaway';
import { SectionHeader } from '../ui/SectionHeader';
import { useStaggerReveal, revealClasses, revealDelay } from '../ui/reveal';

interface EventsProps {
  events: BusinessEvent[];
}

export function Events({ events }: EventsProps) {
  const stagger = useStaggerReveal(events?.length || 0);
  if (!events?.length) return null;

  // Badge 🔒 Épargne — offres actives sur les événements/billets (1 seul appel)
  const eventIds = events.map((e) => e.id);
  const { data: layawayMap } = useLayawayOffers('EVENT', eventIds);

  return (
    <section id="section-events" className="scroll-mt-24 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <SectionHeader eyebrow="Agenda" title="Événements" count={events.length} />

        <div ref={stagger.ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {events.map((event, idx) => {
            const date = event.date ? new Date(event.date) : null;
            return (
              <div
                key={event.id}
                className={cn('group relative', revealClasses(stagger.visible, idx))}
                style={revealDelay(idx)}
              >
                <div className="p-[1px] rounded-[1.25rem] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 h-full biz-card">
                  <div className="bg-white rounded-[calc(1.25rem-1px)] overflow-hidden h-full flex flex-col">
                    {/* Image Zone */}
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                      {event.images?.[0] ? (
                        <Image
                          src={event.images[0]}
                          alt={event.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60">
                          <CalendarRange className="w-10 h-10 text-brand-300" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <LayawayBadge active={!!(layawayMap || {})[event.id]} />
                      </div>

                      {/* Date block */}
                      {date && (
                        <div className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-xl bg-white/92 backdrop-blur-md shadow-lg text-center leading-none">
                          <span className="block text-lg font-extrabold text-gray-900 tracking-tight">
                            {date.getDate()}
                          </span>
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-brand-600 mt-0.5">
                            {date.toLocaleDateString('fr-FR', { month: 'short' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Zone */}
                    <div className="p-4 md:p-5 flex flex-col flex-1">
                      <h3 className="font-semibold text-gray-900 text-[15px] leading-tight mb-1 line-clamp-1">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-[13px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                          {event.description}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="space-y-1.5 text-[12px] text-gray-500 dark:text-gray-400 mb-3">
                        {event.endDate && date && (
                          <p className="flex items-center gap-1.5">
                            <CalendarRange className="w-3.5 h-3.5 text-gray-300" />
                            Jusqu&apos;au{' '}
                            {new Date(event.endDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                            })}
                          </p>
                        )}
                        {event.location && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-300" /> {event.location}
                          </p>
                        )}
                        {event.capacity && (
                          <p className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-gray-300" /> Capacité:{' '}
                            {event.capacity}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                        {event.price != null ? (
                          <span className="text-lg font-bold text-gray-900 tracking-tight">
                            {formatPrice(Number(event.price), event.currency)}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            Gratuit
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-full bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10 transition-all duration-300 active:scale-[0.97]">
                            <Ticket className="w-3.5 h-3.5" /> Participer
                          </button>
                          <LayawayButton offer={(layawayMap || {})[event.id]} itemId={event.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
