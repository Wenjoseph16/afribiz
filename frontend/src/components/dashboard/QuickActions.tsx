'use client';

import { Search, ShoppingBag, Calendar, Compass, Heart, Briefcase, Code } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const actions = [
  {
    label: 'Découvrir',
    description: 'Explorer le marketplace',
    href: '/marketplace',
    icon: Compass,
    color: 'from-emerald-500/20 to-emerald-500/5',
    iconColor: 'text-emerald-400',
  },
  {
    label: 'Produits',
    description: 'Rechercher un produit',
    href: '/marketplace?type=PRODUCT',
    icon: ShoppingBag,
    color: 'from-blue-500/20 to-blue-500/5',
    iconColor: 'text-blue-400',
  },
  {
    label: 'Services',
    description: 'Rechercher un service',
    href: '/marketplace?type=SERVICE',
    icon: Search,
    color: 'from-purple-500/20 to-purple-500/5',
    iconColor: 'text-purple-400',
  },
  {
    label: 'Événements',
    description: 'Trouver un événement',
    href: '/marketplace?type=EVENT',
    icon: Calendar,
    color: 'from-orange-500/20 to-orange-500/5',
    iconColor: 'text-orange-400',
  },
  {
    label: 'Favoris',
    description: 'Mes produits favoris',
    href: '/dashboard/favorites',
    icon: Heart,
    color: 'from-red-500/20 to-red-500/5',
    iconColor: 'text-red-400',
  },
  {
    label: 'Business',
    description: 'Devenir partenaire',
    href: '/dashboard/become-business',
    icon: Briefcase,
    color: 'from-amber-500/20 to-amber-500/5',
    iconColor: 'text-amber-400',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function QuickActions() {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-[0.15em] mb-3">
        Actions rapides
      </h3>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {actions.map((action) => (
          <motion.div key={action.label} variants={itemVariants}>
            <Link
              href={action.href}
              className="group block glass rounded-2xl hover:border-emerald-500/20 transition-all duration-300"
            >
              <div className="relative rounded-[calc(1rem-0.1875rem)] bg-gradient-to-br from-white/[0.02] to-transparent p-4 text-center">
                <div className="absolute inset-0 rounded-[calc(1rem-0.1875rem)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
                <div className="relative">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200',
                      action.color
                    )}
                  >
                    <action.icon className={cn('w-5 h-5', action.iconColor)} />
                  </div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-white/70 group-hover:text-gray-900 dark:text-white transition-colors">
                    {action.label}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-white/25 mt-0.5 hidden sm:block">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
