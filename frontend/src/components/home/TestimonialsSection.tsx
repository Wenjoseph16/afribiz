'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { fadeInUp } from './animations';
import { SectionLabel } from './SectionLabel';
import { SectionHeading } from './SectionHeading';
import { useHomeData } from '@/hooks/useHomeData';

export function TestimonialsSection() {
  // Témoignages RÉELS du CMS (plus de données fictives) — via le hook partagé /api/home
  const { data, isFetched } = useHomeData();
  const testimonials = data?.testimonials || [];

  if (isFetched && testimonials.length === 0) return null;

  return (
    <section className="py-20 sm:py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp}>
          <SectionLabel text="Témoignages" />
          <SectionHeading
            title="La preuve que l’outil tient ses promesses"
            subtitle="Des entrepreneurs qui ont transformé leurs opérations en quelques semaines seulement."
          />
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.slice(0, 6).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-card-hover transition-all duration-300"
            >
              <Quote className="h-8 w-8 text-brand/20 dark:text-brand/10 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 italic">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: Math.min(Math.max(t.rating, 1), 5) }).map((_, j) => (
                  <Star key={`star-${j}`} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {[t.title, t.company].filter(Boolean).join(' · ')}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
