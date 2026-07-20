'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Play, Smartphone } from 'lucide-react';

const stats = [
  { value: '10k+', label: 'Entrepreneurs actifs' },
  { value: '2M+', label: 'Transactions traitées' },
  { value: '50+', label: 'Types de business' },
  { value: '99.9%', label: 'Disponibilité' },
];

export function HeroSection() {
  return (
    <section className="relative pt-36 pb-24 sm:pt-40 sm:pb-28 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(5,150,105,0.12),_transparent_50%)]" />
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[rgba(5,150,105,0.06)] rounded-full blur-3xl" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand dark:text-brand-400 rounded-full text-sm font-medium mb-6 border border-brand/10 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              La plateforme SaaS no.1 pour l&apos;Afrique
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
              Propulsez votre <span className="gradient-text">business</span>
              <br />
              depuis chez vous.
            </h1>
            <p className="mt-5 text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
              La plateforme tout-en-un pour les entrepreneurs africains. Vendez vos produits, gérez
              vos rendez-vous et encaissez vos paiements en toute simplicité.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand to-emerald-400 text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:shadow-xl hover:shadow-brand/25 transition-all duration-200 group"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/preview"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
              >
                <Play className="h-4 w-4" />
                Voir un exemple
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
              >
                Contact
              </Link>
            </div>
            <div className="flex items-center gap-3 mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex -space-x-2">
                {['KD', 'AS', 'ST', 'TL'].map((init, i) => (
                  <div
                    key={init}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-[10px] font-bold"
                  >
                    {init}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-500">
                  +5k
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-gray-100">+10 000</span>{' '}
                entrepreneurs nous font confiance
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 text-center truncate border border-gray-200 dark:border-gray-600">
                    maboutique.afribiz.app/dashboard
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Ventes', value: '€1,240', change: '+12%', up: true },
                    { label: 'Clients', value: '89', change: '+8%', up: true },
                    { label: 'Commandes', value: '34', change: '-3%', up: false },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {stat.value}
                      </p>
                      <span
                        className={`text-xs font-medium ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Chemise Kente', price: '€25.00', status: 'Livré' },
                    { name: 'Huile de Karité', price: '€12.50', status: 'En cours' },
                    { name: 'Sac Tissé Main', price: '€35.00', status: 'En attente' },
                  ].map((item, i) => (
                    <div
                      key={`${item.name}-${i}`}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {item.price}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'Livré' ? 'bg-emerald-50 text-emerald-700' : item.status === 'En cours' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-52 bg-gray-900 dark:bg-gray-700 rounded-2xl border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden hidden sm:block">
              <div className="p-2">
                <div className="w-full h-3 rounded-full bg-gray-700 mb-2" />
                <div className="space-y-1.5">
                  <div className="w-3/4 h-2 rounded bg-emerald-500/30" />
                  <div className="w-1/2 h-2 rounded bg-gray-600" />
                  <div className="w-2/3 h-2 rounded bg-gray-600" />
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -left-4 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-brand" />
                <span className="text-xs font-medium">Mobile-first</span>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 sm:mt-20 max-w-3xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center group">
              <p className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
