'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { fadeInUp } from './animations';
import { SectionLabel } from './SectionLabel';
import { SectionHeading } from './SectionHeading';

const pricingPlans = [
  {
    name: 'Gratuit',
    price: '0',
    period: '/mois',
    description: 'Pour démarrer sans risque',
    popular: true,
    highlight: 'Recommandé',
    features: [
      'Profil business public complet',
      'Produits, services et réservations',
      'Paiements Mobile Money (Wave, TMoney, Flooz)',
      'Système Escrow (tiers de confiance)',
      'Tous les modules de gestion',
      'Support communautaire',
    ],
    cta: 'Commencer gratuitement',
    href: '/signup',
  },
  {
    name: 'Copilot IA',
    price: 'Bientôt',
    period: '',
    description: 'Assistant intelligent IA',
    popular: false,
    highlight: 'À venir',
    features: [
      'Alertes WhatsApp automatiques',
      'Prédiction des ruptures de stock',
      'Analyse des pics de vente',
      'Recommandations personnalisées',
      'Rapports intelligents',
      'Gestion prédictive',
    ],
    cta: 'Être notifié',
    href: '/signup',
  },
  {
    name: 'Développeur',
    price: 'Gratuit',
    period: '',
    description: "Pour bâtir l'écosystème",
    popular: false,
    highlight: 'Écosystème',
    features: [
      'Accès API REST complet',
      'Documentation technique',
      'Publication de modules',
      'Sandbox de test',
      'Revenue sharing 80/20',
      'Support technique dédié',
    ],
    cta: "Rejoindre l'espace Dev",
    href: '/signup',
  },
];

export function PricingSection() {
  return (
    <section className="py-20 sm:py-28 px-4 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp}>
          <SectionLabel text="Tarifs" />
          <SectionHeading
            title="Un modèle clair pour passer de l’idée à la croissance"
            subtitle="Commencez sans risque, gagnez en maturité au rythme de votre activité."
          />
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 sm:p-8 flex flex-col ${plan.popular ? 'border-brand shadow-card-hover scale-[1.02] md:scale-105 z-10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'} transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-emerald-400 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-brand/20">
                  {plan.highlight}
                </div>
              )}
              {!plan.popular && plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-5 py-1.5 rounded-full">
                  {plan.highlight}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>
                  )}
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? 'text-brand' : plan.name === 'Développeur' ? 'text-purple-500' : 'text-gray-400'}`}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${plan.popular ? 'bg-gradient-to-r from-brand to-emerald-400 text-white hover:shadow-xl hover:shadow-brand/25' : plan.name === 'Développeur' ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:shadow-xl' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 border border-gray-200'}`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
