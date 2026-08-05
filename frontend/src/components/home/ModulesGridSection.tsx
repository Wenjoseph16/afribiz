'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingBag,
  BarChart3,
  MessageCircle,
  Users,
  Calendar,
  FileText,
  Truck,
  Building2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from './animations';
import { SectionLabel } from './SectionLabel';
import { SectionHeading } from './SectionHeading';
import { useHomeData, HomeModule } from '@/hooks/useHomeData';

const CATEGORY_STYLES: Record<
  string,
  { icon: any; color: string; bgColor: string; iconColor: string }
> = {
  Gestion: {
    icon: Package,
    color: 'from-emerald-500 to-teal-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600',
  },
  Marketing: {
    icon: ShoppingBag,
    color: 'from-amber-500 to-orange-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    iconColor: 'text-amber-600',
  },
  Communication: {
    icon: MessageCircle,
    color: 'from-blue-500 to-indigo-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-600',
  },
  Analytics: {
    icon: BarChart3,
    color: 'from-violet-500 to-purple-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    iconColor: 'text-violet-600',
  },
  Vente: {
    icon: ShoppingBag,
    color: 'from-rose-500 to-pink-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    iconColor: 'text-rose-600',
  },
  Livraison: {
    icon: Truck,
    color: 'from-cyan-500 to-teal-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    iconColor: 'text-cyan-600',
  },
};

const DEFAULT_STYLE = {
  icon: Building2,
  color: 'from-gray-500 to-gray-400',
  bgColor: 'bg-gray-50 dark:bg-gray-800',
  iconColor: 'text-gray-600',
};

function formatPrice(m: HomeModule) {
  if (m.isFree) return 'Gratuit';
  const n = Number(m.price) || 0;
  return `${n.toLocaleString('fr-FR')} ${m.currency || 'FCFA'}`;
}

export function ModulesGridSection() {
  // Modules RÉELS du marketplace développeurs (plus de données fictives) — via /api/home
  const { data, isFetched } = useHomeData();
  const modules = (data?.modules || []) as HomeModule[];

  if (isFetched && modules.length === 0) return null;

  return (
    <section className="py-20 sm:py-28 px-4 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeInUp}>
          <SectionLabel text="Marketplace" />
          <SectionHeading
            title="Des modules développés pour booster votre activité"
            subtitle="Des extensions développées par notre communauté et installables en un clic depuis votre espace business."
          />
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {modules.slice(0, 8).map((mod, idx) => {
            const style = CATEGORY_STYLES[mod.category] || DEFAULT_STYLE;
            const Icon = style.icon;
            const isLarge = idx === 0 && mod.isFeatured;
            return (
              <motion.div
                key={mod.id}
                variants={staggerItem}
                className={`relative group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 ${isLarge ? 'sm:col-span-2 sm:row-span-2' : ''}`}
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${style.color}`}
                />
                <div className={`p-5 sm:p-6 ${isLarge ? 'sm:p-7' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${style.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${style.iconColor}`} />
                    </div>
                    {mod.isVerified && (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        Vérifié
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                      {mod.name}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                    {mod.description}
                  </p>
                  {mod.tags && mod.tags.length > 0 && (
                    <ul className="space-y-1.5 mb-4">
                      {mod.tags.slice(0, 3).map((tag) => (
                        <li
                          key={tag}
                          className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                        >
                          <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatPrice(mod)}
                    </span>
                    <Link
                      href="/marketplace"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:gap-2 transition-all"
                    >
                      Découvrir <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
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
