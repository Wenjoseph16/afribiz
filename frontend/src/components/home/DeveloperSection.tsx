'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code, BookOpen, CreditCard, Globe, ArrowRight } from 'lucide-react';
import { fadeInLeft, fadeInRight } from './animations';
import { SectionLabel } from './SectionLabel';

export function DeveloperSection() {
  const benefits = [
    { icon: Code, label: 'API REST puissante', color: 'text-purple-500' },
    { icon: BookOpen, label: 'Documentation complète', color: 'text-blue-500' },
    { icon: CreditCard, label: 'Revenue sharing', color: 'text-emerald-500' },
    { icon: Globe, label: 'Marché panafricain', color: 'text-amber-500' },
  ];

  return (
    <section className="py-20 sm:py-28 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div {...fadeInLeft}>
            <SectionLabel text="Développeurs" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              Bâtie par des développeurs,
              <br />
              <span className="gradient-text-purple">pour l&apos;Afrique</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Vous êtes développeur ? Créez des modules personnalisés — moyens de paiement locaux,
              outils de livraison, thèmes visuels — et gagnez de l&apos;argent à chaque utilisation.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit) => {
                const BIcon = benefit.icon;
                return (
                  <div key={benefit.label} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <BIcon className={`h-4 w-4 ${benefit.color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {benefit.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-200 group"
            >
              Rejoindre l&apos;espace Développeur
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.div {...fadeInRight} className="relative">
            <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-950 dark:bg-gray-900 border-b border-gray-800">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs text-gray-500 ml-2">api/afribiz.js</span>
              </div>
              <div className="p-5 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed">
                <div>
                  <span className="text-purple-400">import</span>
                  <span className="text-gray-300">{String.fromCharCode(123)} </span>
                  <span className="text-cyan-300">AfriBizAPI</span>
                  <span className="text-gray-300">{String.fromCharCode(125)} </span>
                  <span className="text-purple-400">from</span>
                  <span className="text-emerald-300"> '@afribiz/sdk'</span>
                  <span className="text-gray-500">;</span>
                </div>
                <div className="mt-2">
                  <span className="text-purple-400">const</span>
                  <span className="text-gray-300"> api = </span>
                  <span className="text-purple-400">new</span>
                  <span className="text-cyan-300"> AfriBizAPI</span>
                  <span className="text-gray-500">(</span>
                </div>
                <div className="ml-4">
                  <span className="text-gray-500"> apiKey: </span>
                  <span className="text-emerald-300">'afribiz_sk_...'</span>
                  <span className="text-gray-500">,</span>
                </div>
                <div className="ml-4">
                  <span className="text-gray-500"> region: </span>
                  <span className="text-emerald-300">'africa-west'</span>
                  <span className="text-gray-500">,</span>
                </div>
                <div>
                  <span className="text-gray-500">);</span>
                </div>
                <div className="mt-3">
                  <span className="text-gray-500">{'// Créer un module de paiement'}</span>
                </div>
                <div className="mt-1">
                  <span className="text-purple-400">const</span>
                  <span className="text-gray-300"> payment = </span>
                  <span className="text-purple-400">await</span>
                  <span className="text-gray-300"> api</span>
                  <span className="text-gray-500">.</span>
                  <span className="text-cyan-300">createModule</span>
                  <span className="text-gray-500">(</span>
                  <span className="text-gray-500">{String.fromCharCode(123)}</span>
                </div>
                <div className="ml-4">
                  <span className="text-gray-500"> name: </span>
                  <span className="text-emerald-300">'Orange Money Pro'</span>
                  <span className="text-gray-500">,</span>
                </div>
                <div className="ml-4">
                  <span className="text-gray-500"> revenue: </span>
                  <span className="text-purple-300">0.05</span>
                  <span className="text-gray-500">,</span>
                </div>
                <div>
                  <span className="text-gray-500">{String.fromCharCode(125)});</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
