'use client';

import Image from 'next/image';
import { Promotion } from '@/types/business';
import { Tag, Percent } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';

interface PromotionsProps {
  promotions: Promotion[];
}

export function Promotions({ promotions }: PromotionsProps) {
  if (!promotions?.length) return null;

  const now = new Date();

  return (
    <section id="section-promotions" className="scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Promotions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => {
            const isExpired = promo.endsAt && new Date(promo.endsAt) < now;
            return (
              <div key={promo.id} className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden ${isExpired ? 'border-gray-200 dark:border-gray-700 opacity-60' : 'border-brand-200 dark:border-brand-800'}`}>
                {promo.image && (
                  <div className="h-32 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    <Image src={promo.image} alt={promo.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{promo.title}</h3>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${promo.discountType === 'PERCENTAGE' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                      {promo.discountType === 'PERCENTAGE' ? <Percent className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                      {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : formatPrice(Number(promo.discountValue))}
                    </span>
                  </div>
                  {promo.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{promo.description}</p>}
                  {promo.code && (
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 mb-3">
                      <Tag className="w-3.5 h-3.5 text-brand" />
                      <code className="text-sm font-mono font-bold text-brand">{promo.code}</code>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    {promo.startsAt && <span>Du {new Date(promo.startsAt).toLocaleDateString('fr-FR')}</span>}
                    {promo.endsAt && <span>au {new Date(promo.endsAt).toLocaleDateString('fr-FR')}</span>}
                  </div>
                  {isExpired && <span className="mt-2 inline-block text-xs text-red-500">Expirée</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
