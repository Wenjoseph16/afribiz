'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Star, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { fadeInUp } from './animations';
import { SectionLabel } from './SectionLabel';
import { SectionHeading } from './SectionHeading';
import { apiClient } from '@/services/apiClient';

interface ShowcaseBusiness {
  id: string;
  name: string;
  slug: string;
  type?: string | null;
  city?: string | null;
  country?: string | null;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
}

export function BusinessCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [businesses, setBusinesses] = useState<ShowcaseBusiness[]>([]);

  // Business RÉELS du marketplace (plus de données fictives)
  useEffect(() => {
    let mounted = true;
    apiClient
      .getTrendingMarketplace()
      .then((res: any) => {
        if (!mounted) return;
        const list: ShowcaseBusiness[] = res?.data?.data?.topBusinesses || [];
        setBusinesses(list.slice(0, 8));
      })
      .catch(() => {
        // Silencieux : le carrousel s'affiche vide plutôt que de montrer du faux contenu
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!autoplay || !carouselRef.current || businesses.length === 0) return;
    const interval = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth / 2;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'instant' });
      }
      el.scrollBy({ left: 320, behavior: 'smooth' });
    }, 3500);
    return () => clearInterval(interval);
  }, [autoplay, businesses]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  const carouselItems = [...businesses, ...businesses];

  return (
    <section className="py-20 px-4 overflow-hidden bg-white dark:bg-gray-900/20">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp}>
          <SectionLabel text="Marketplace" />
          <SectionHeading
            title="Business en vedette"
            subtitle="Découvrez des boutiques créées sur AfriBiz."
          />
        </motion.div>
        <div className="relative">
          <button
            onClick={() => scrollCarousel('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all -ml-5 hidden sm:flex"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollCarousel('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all -mr-5 hidden sm:flex"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div
            ref={carouselRef}
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
            className="flex gap-5 overflow-x-auto scrollbar-none py-2 px-1 snap-x snap-mandatory"
          >
            {carouselItems.length === 0 && (
              <div className="w-full text-center py-10 text-sm text-gray-400">
                Les business en vedette arrivent bientôt.
              </div>
            )}
            {carouselItems.map((item, i) => (
              <div key={`${item.id}-${i}`} className="min-w-[260px] sm:min-w-[280px] snap-start">
                <Link
                  href={`/business/${item.slug || item.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="h-36 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-xl bg-white/80 dark:bg-gray-700/80 flex items-center justify-center shadow-sm">
                      <Store className="h-6 w-6 text-brand" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                        {item.name}
                      </h3>
                      {item.isVerified && (
                        <span className="badge-success text-[10px] px-1.5 py-0.5">Vérifié</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                      {item.type || 'Business'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-medium text-gray-700">
                          {item.rating ? Number(item.rating).toFixed(1) : '—'}
                        </span>
                        <span className="text-xs text-gray-400">
                          · {item.reviewCount || 0} avis
                        </span>
                      </div>
                      <span className="text-xs font-medium text-brand group-hover:gap-1.5 transition-all inline-flex items-center gap-0.5">
                        Visiter <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                    {item.city && (
                      <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {item.city}
                        {item.country ? `, ${item.country}` : ''}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
