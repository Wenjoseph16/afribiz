'use client';

import Image from 'next/image';
import { Rental } from '@/types/business';
import { Package, Calendar, Shield, FileText } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';

interface RentalsProps {
  rentals: Rental[];
}

export function Rentals({ rentals }: RentalsProps) {
  if (!rentals?.length) return null;

  return (
    <section id="section-rentals" className="scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Locations</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentals.map((rental) => (
            <div key={rental.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                {rental.images?.[0] ? (
                  <Image src={rental.images[0]} alt={rental.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><Package className="w-12 h-12" /></div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{rental.name}</h3>
                {rental.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{rental.description}</p>}

                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Tarif journalier</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(Number(rental.price), rental.currency)}/{rental.unit}</span>
                  </div>
                  {rental.weeklyPrice != null && (
                    <div className="flex items-center justify-between">
                      <span>Tarif hebdomadaire</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(Number(rental.weeklyPrice), rental.currency)}/sem</span>
                    </div>
                  )}
                  {rental.deposit != null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Caution</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(Number(rental.deposit), rental.currency)}</span>
                    </div>
                  )}
                </div>

                {rental.conditions && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
                    <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{rental.conditions}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className={`text-xs ${rental.isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {rental.isAvailable ? 'Disponible' : 'Indisponible'}
                    {rental.quantity > 1 && ` (${rental.quantity})`}
                  </span>
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors">
                    <Calendar className="w-3 h-3" /> Réserver
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
