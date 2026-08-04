'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { fadeInUp } from './animations';
import { SectionLabel } from './SectionLabel';
import { SectionHeading } from './SectionHeading';
import { useHomeData } from '@/hooks/useHomeData';

export function FAQSection() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // FAQ RÉELLES du CMS (plus de données fictives) — via le hook partagé /api/home
  const { data, isFetched } = useHomeData();
  const faqs = data?.faqs || [];

  if (isFetched && faqs.length === 0) return null;

  return (
    <section className="py-20 sm:py-28 px-4 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="max-w-3xl mx-auto">
        <motion.div {...fadeInUp}>
          <SectionLabel text="FAQ" />
          <SectionHeading
            title="Tout ce qu’il faut clarifier avant de lancer"
            subtitle="Des réponses simples pour une mise en route rapide et sereine."
          />
        </motion.div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:border-gray-300 dark:hover:border-gray-600"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="flex items-center justify-between w-full px-5 sm:px-6 py-4 sm:py-5 text-left"
              >
                <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-4 sm:pb-5">
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
