'use client';

import Link from 'next/link';
import { Leaf, Target, Users, Globe, Zap, Heart, Check, ArrowRight, Sparkles, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const values = [
  { icon: Target, title: 'Notre Mission', description: "Donner à chaque entrepreneur africain les outils numériques pour développer son business, où qu'il soit." },
  { icon: Users, title: 'Notre Vision', description: "Devenir la plateforme de référence pour les PME africaines en construisant l'écosystème entrepreneurial le plus inclusif du continent." },
  { icon: Heart, title: 'Nos Valeurs', description: 'Innovation, accessibilité, inclusion et impact local. Nous croyons en la puissance de la technologie pour transformer les économies africaines.' },
  { icon: Globe, title: 'Notre Impact', description: "Déjà +10 000 entrepreneurs actifs, +50 types de business, dans +15 pays africains. Et nous ne faisons que commencer." },
];

const team = [
  { name: 'Koffi Amégnon', role: 'Fondateur & CEO', initials: 'KA', color: 'from-brand to-emerald-400' },
  { name: 'Awa Diallo', role: 'CTO', initials: 'AD', color: 'from-purple-600 to-indigo-500' },
  { name: 'Jean Mensah', role: 'Chief Product Officer', initials: 'JM', color: 'from-blue-500 to-cyan-400' },
  { name: 'Fatou Sall', role: 'Chief Marketing Officer', initials: 'FS', color: 'from-amber-500 to-orange-400' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(5,150,105,0.08),_transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div {...fadeInUp} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand dark:text-brand-400 rounded-full text-sm font-medium mb-6 border border-brand/10">
              <Sparkles className="h-3.5 w-3.5" />
              À propos
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-6">
              Nous construisons l&apos;avenir du <span className="gradient-text">business africain</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              AfriBiz est née d&apos;une conviction : les entrepreneurs africains méritent des outils 
              numériques puissants, accessibles et adaptés à leurs réalités.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">Notre histoire</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed text-left">
              <p>
                Tout a commencé en 2023, quand notre fondateur, Koffi Amégnon, a réalisé que la plupart 
                des solutions SaaS disponibles ne répondaient pas aux besoins spécifiques des entrepreneurs africains.
                Trop chères, trop complexes, ou tout simplement pas adaptées aux réalités locales.
              </p>
              <p>
                AfriBiz a été conçue dès le départ pour être mobile-first, intégrer les moyens de paiement 
                locaux (Mobile Money), et offrir des fonctionnalités modulaires que chaque entrepreneur peut 
                activer selon ses besoins.
              </p>
              <p>
                Aujourd&apos;hui, AfriBiz est utilisée par des milliers d&apos;entrepreneurs à travers l&apos;Afrique, 
                des artisans aux PME en pleine croissance. Et nous continuons d&apos;innover chaque jour.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Notre raison d&apos;être</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 hover:shadow-card-hover transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">Notre équipe</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Des passionnés de technologie au service de l&apos;entrepreneuriat africain.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {team.map((member, i) => (
              <motion.div key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center group"
              >
                <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {member.initials}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{member.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '10k+', label: 'Entrepreneurs' },
              { value: '15+', label: 'Pays couverts' },
              { value: '50+', label: 'Types de business' },
              { value: '99.9%', label: 'Disponibilité' },
            ].map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-emerald-700 to-emerald-900 p-8 sm:p-12 text-center text-white"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Rejoignez l&apos;aventure AfriBiz</h2>
              <p className="text-emerald-100/80 max-w-lg mx-auto mb-8">Créez votre business gratuitement et faites partie de la révolution numérique africaine.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-brand px-8 py-3.5 rounded-xl font-semibold hover:bg-emerald-50 hover:shadow-xl transition-all">
                Commencer gratuitement <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
