'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { fadeInUp } from './animations';
import { SectionLabel } from './SectionLabel';
import { SectionHeading } from './SectionHeading';

const faqs = [
  {
    q: 'Puis-je utiliser AfriBiz uniquement depuis mon smartphone ?',
    a: "Oui ! AfriBiz est conçu mobile-first. Gérez votre boutique, commandes et paiements depuis n'importe quel smartphone.",
  },
  {
    q: 'Comment sont gérés les paiements ?',
    a: 'Nous intégrons Mobile Money (Orange Money, MTN MoMo, Free Money), transferts bancaires et cartes. Les fonds sont sécurisés via Escrow et reversés sous 48h.',
  },
  {
    q: 'Est-ce vraiment gratuit pour commencer ?',
    a: "Absolument ! Le plan Gratuit est gratuit à vie sans engagement. Pas d'abonnement. Vous ne payez que 1% de commission uniquement sur vos ventes.",
  },
  {
    q: 'Puis-je vendre depuis plusieurs pays africains ?',
    a: 'Oui, AfriBiz supporte les transactions multi-pays avec les moyens de paiement locaux de chaque pays.',
  },
  {
    q: "Comment fonctionne l'espace développeur ?",
    a: "Créez des modules personnalisés, intégrations, thèmes et outils. Gagnez de l'argent à chaque utilisation par les business.",
  },
];

export function FAQSection() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
              key={faq.q}
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
                  {faq.q}
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
                        {faq.a}
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
