'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useActiveOffers } from '@/hooks/features/useOffers';
import { OfferCard } from '@/components/media/OfferCard';

export default function OffersPage() {
  const { data: offersData } = useActiveOffers({ limit: 30 });
  const offers = offersData?.items || [];
  const featured = offers.filter((o: any) => o.isFeatured);
  const rest = offers.filter((o: any) => !o.isFeatured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Offres Flash</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Des réductions limitées dans le temps. Dépêchez-vous avant la fin !
          </p>
        </div>
      </div>

      {/* Offres à la une */}
      {featured.length > 0 && (
        <section className="bg-gradient-to-r from-red-600/5 via-amber-500/5 to-orange-600/5 dark:from-red-600/10 dark:via-amber-500/10 dark:to-orange-600/10 rounded-3xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> À la une
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((o: any) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}

      {/* Toutes les offres */}
      {rest.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Toutes les offres
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rest.map((o: any) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {offers.length === 0 && (
        <div className="text-center py-20">
          <Zap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Aucune offre flash en ce moment
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            Revenez bientôt, les commerces préparent des surprises !
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all"
          >
            Découvrir le marketplace
          </Link>
        </div>
      )}
    </div>
  );
}
