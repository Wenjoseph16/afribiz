'use client';

import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Calendar,
  FileText,
  MessageCircle,
  Package,
  Users,
  Check,
} from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from './animations';
import { SectionLabel } from './SectionLabel';
import { SectionHeading } from './SectionHeading';

const modules = [
  {
    icon: ShoppingBag,
    title: 'E-Commerce',
    description: 'Vendez des produits avec gestion des stocks et commandes.',
    color: 'from-emerald-500 to-teal-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600',
    features: [
      'Gestion des stocks',
      'Catalogue illimité',
      'Paiements Mobile Money',
      'Suivi des commandes',
    ],
    size: 'large' as const,
  },
  {
    icon: Calendar,
    title: 'Réservations',
    description: 'Pour prestataires : coiffeurs, coachs, consultants.',
    color: 'from-blue-500 to-indigo-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600',
    features: [
      'Calendrier interactif',
      'Rappels automatiques',
      'Disponibilités temps réel',
      'Annulation facile',
    ],
    size: 'medium' as const,
  },
  {
    icon: FileText,
    title: 'Facturation',
    description: 'Générez fiches, factures et reçus PDF.',
    color: 'from-violet-500 to-purple-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    iconColor: 'text-violet-600',
    features: ['Factures PDF', 'Devis personnalisés', 'Suivi des paiements', 'Historique complet'],
    size: 'medium' as const,
  },
  {
    icon: MessageCircle,
    title: 'Marketing & SMS',
    description: 'Relancez clients directement sur leur téléphone.',
    color: 'from-amber-500 to-orange-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600',
    features: ['Campagnes SMS', 'Relance automatique', 'Statistiques', 'Segmentation clients'],
    size: 'medium' as const,
  },
  {
    icon: Package,
    title: 'Location',
    description: 'Gérez la location de biens (voitures, appareils, salles).',
    color: 'from-rose-500 to-pink-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    iconColor: 'text-rose-600',
    features: [
      'Catalogue locations',
      'Calendrier dispo',
      'Tarification flexible',
      'Contrats automatiques',
    ],
    size: 'small' as const,
  },
  {
    icon: Users,
    title: 'Événements',
    description: 'Créez des événements et vendez vos billets en ligne.',
    color: 'from-cyan-500 to-teal-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    iconColor: 'text-cyan-600',
    features: ['Billetterie en ligne', 'Gestion invités', 'Programme interactif', 'Notifications'],
    size: 'small' as const,
  },
];

export function ModulesGridSection() {
  return (
    <section className="py-20 sm:py-28 px-4 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp}>
          <SectionLabel text="Modules" />
          <SectionHeading
            title="Activez les modules dont votre entreprise a besoin"
            subtitle="Une approche modulaire : choisissez les fonctionnalités qui correspondent à votre activité."
          />
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isLarge = mod.size === 'large';
            return (
              <motion.div
                key={mod.title}
                variants={staggerItem}
                className={`relative group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 ${isLarge ? 'sm:col-span-2 sm:row-span-2' : ''}`}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.color}`}
                />
                <div className={`p-5 sm:p-6 ${isLarge ? 'sm:p-7' : ''}`}>
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${mod.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${mod.iconColor}`} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                    {mod.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    {mod.description}
                  </p>
                  <ul className="space-y-1.5">
                    {mod.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                      >
                        <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
