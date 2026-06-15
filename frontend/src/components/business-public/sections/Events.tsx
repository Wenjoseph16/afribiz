'use client';

import Image from 'next/image';
import { BusinessEvent } from '@/types/business';
import { CalendarRange, MapPin, Users, Ticket } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';

interface EventsProps {
  events: BusinessEvent[];
}

export function Events({ events }: EventsProps) {
  if (!events?.length) return null;

  return (
    <section id="section-events" className="scroll-mt-32 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Événements</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                {event.images?.[0] ? (
                  <Image src={event.images[0]} alt={event.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><CalendarRange className="w-10 h-10" /></div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h3>
                {event.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{event.description}</p>}
                <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {event.date && (
                    <p className="flex items-center gap-1.5">
                      <CalendarRange className="w-3.5 h-3.5" />
                      {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                    </p>
                  )}
                  {event.location && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.location}</p>}
                  {event.capacity && <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Capacité: {event.capacity}</p>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  {event.price != null ? (
                    <span className="font-bold text-brand">{formatPrice(Number(event.price), event.currency)}</span>
                  ) : <span className="text-sm text-green-600 dark:text-green-400">Gratuit</span>}
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors">
                    <Ticket className="w-3 h-3" /> Participer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
