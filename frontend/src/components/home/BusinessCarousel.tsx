'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { fadeInUp } from './animations';
import { SectionLabel } from './SectionLabel';
import { SectionHeading } from './SectionHeading';

const showcaseItems = [
  { name: 'Kente Création', type: 'Mode & Artisanat', rating: 4.8, sales: '1.2k', verified: true },
  {
    name: 'Awa Consulting',
    type: 'Conseil & Stratégie',
    rating: 4.9,
    sales: '850',
    verified: true,
  },
  { name: 'Saveur du Togo', type: 'Restauration', rating: 4.7, sales: '2.1k', verified: true },
  { name: 'TechLomé', type: 'Services IT', rating: 4.6, sales: '630', verified: true },
  { name: 'DesignLab Africa', type: 'Design & Créa', rating: 4.9, sales: '1.5k', verified: true },
  { name: 'GreenHome Togo', type: 'Décoration', rating: 4.5, sales: '420', verified: false },
  { name: 'Santé Plus', type: 'Services médicaux', rating: 4.8, sales: '970', verified: true },
  { name: 'EduKids Africa', type: 'Éducation', rating: 4.7, sales: '1.8k', verified: true },
];

export function BusinessCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [autoplay, setAutoplay] = useState(true);
  const carouselItems = [...showcaseItems, ...showcaseItems];

  useEffect(() => {
    if (!autoplay || !carouselRef.current) return;
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
  }, [autoplay]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

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
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollCarousel('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all -mr-5 hidden sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div
            ref={carouselRef}
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
            className="flex gap-5 overflow-x-auto scrollbar-none py-2 px-1 snap-x snap-mandatory"
          >
            {carouselItems.map((item, i) => (
              <div key={`${item.name}-${i}`} className="min-w-[260px] sm:min-w-[280px] snap-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group">
                  <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-xl bg-white/80 dark:bg-gray-700/80 flex items-center justify-center shadow-sm">
                      <Store className="h-6 w-6 text-brand" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {item.name}
                      </h3>
                      {item.verified && (
                        <span className="badge-success text-[10px] px-1.5 py-0.5">Vérifié</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.type}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-medium text-gray-700">{item.rating}</span>
                        <span className="text-xs text-gray-400">· {item.sales} ventes</span>
                      </div>
                      <span className="text-xs font-medium text-brand group-hover:gap-1.5 transition-all inline-flex items-center gap-0.5">
                        Visiter <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
