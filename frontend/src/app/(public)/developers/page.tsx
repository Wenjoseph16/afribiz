'use client';

import Link from 'next/link';
import { Code, BookOpen, CreditCard, Globe, Check, ArrowRight, Sparkles, Terminal, Users, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const benefits = [
  { icon: Code, title: 'API REST puissante', description: 'Accédez à toutes les fonctionnalités d\'AfriBiz via notre API REST documentée.' },
  { icon: BookOpen, title: 'Documentation complète', description: 'Guides, SDK, exemples de code et tutoriels pour intégrer AfriBiz rapidement.' },
  { icon: CreditCard, title: 'Revenue Sharing', description: "Gagnez de l'argent à chaque fois qu'un business utilise votre module." },
  { icon: Globe, title: 'Marché panafricain', description: 'Publiez vos modules sur tout le continent africain.' },
  { icon: Shield, title: 'Sandbox sécurisé', description: 'Développez et testez dans un environnement isolé avant la mise en production.' },
  { icon: Users, title: 'Communauté active', description: 'Échangez avec d\'autres développeurs et obtenez du support technique.' },
];

const steps = [
  { number: '01', title: 'Créez votre compte', description: 'Inscrivez-vous en tant que développeur sur AfriBiz.' },
  { number: '02', title: 'Explorez la documentation', description: 'Accédez à notre documentation complète et aux SDK disponibles.' },
  { number: '03', title: 'Développez votre module', description: 'Utilisez notre API pour créer des fonctionnalités personnalisées.' },
  { number: '04', title: 'Soumettez et publiez', description: "Soumettez votre module pour validation et publiez-le sur la Marketplace." },
  { number: '05', title: 'Gagnez de l\'argent', description: "Recevez une part des revenus générés par votre module à chaque utilisation." },
];

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(139,92,246,0.08),_transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium mb-6 border border-purple-200/50 dark:border-purple-800/50">
                <Terminal className="h-3.5 w-3.5" />
                Espace Développeurs
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
                Bâtie par des développeurs,<br />
                <span className="text-purple-600 dark:text-purple-400">pour l&apos;Afrique.</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed mb-8">
                Créez des modules personnalisés — moyens de paiement locaux, outils de livraison,
                thèmes visuels — et gagnez de l&apos;argent à chaque fois qu&apos;un business les utilise.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Link href="/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:shadow-xl hover:shadow-purple-500/25 transition-all group">
                  Commencer à développer <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#documentation" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  <BookOpen className="h-4 w-4" /> Documentation
                </Link>
              </div>
            </motion.div>

            {/* Code Preview */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-950 border-b border-gray-800">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /></div>
                  <span className="text-xs text-gray-500 ml-2">modules/paiement-om.ts</span>
                </div>
                <div className="p-5 font-mono text-xs sm:text-sm leading-relaxed">
                  <div><span className="text-purple-400">import</span><span className="text-gray-300">{String.fromCharCode(123)} </span><span className="text-cyan-300">AfriBizAPI</span><span className="text-gray-300">{String.fromCharCode(125)} </span><span className="text-purple-400">from</span><span className="text-emerald-300"> '@afribiz/sdk'</span><span className="text-gray-500">;</span></div>
                  <div className="mt-2"><span className="text-gray-500">// Module Orange Money Pro</span></div>
                  <div><span className="text-purple-400">const</span><span className="text-gray-300"> api = </span><span className="text-purple-400">new</span><span className="text-cyan-300"> AfriBizAPI</span><span className="text-gray-500">(</span><span className="text-gray-500">{String.fromCharCode(123)}</span></div>
                  <div className="ml-4"><span className="text-gray-500">  apiKey: process</span><span className="text-gray-300">.</span><span className="text-cyan-300">env</span><span className="text-gray-300">.</span><span className="text-amber-300">AFRIBIZ_API_KEY</span><span className="text-gray-500">,</span></div>
                  <div className="ml-4"><span className="text-gray-500">  region: </span><span className="text-emerald-300">'africa-west'</span><span className="text-gray-500">,</span></div>
                  <div><span className="text-gray-500">{String.fromCharCode(125)});</span></div>
                  <div className="mt-2"><span className="text-gray-500">// Nouveau module de paiement</span></div>
                  <div><span className="text-purple-400">const</span><span className="text-gray-300"> module = </span><span className="text-purple-400">await</span><span className="text-gray-300"> api.</span><span className="text-cyan-300">registerModule</span><span className="text-gray-500">({String.fromCharCode(123)}</span></div>
                  <div className="ml-4"><span className="text-gray-500">  name: </span><span className="text-emerald-300">'Orange Money Pro'</span><span className="text-gray-500">,</span></div>
                  <div className="ml-4"><span className="text-gray-500">  type: </span><span className="text-emerald-300">'payment'</span><span className="text-gray-500">,</span></div>
                  <div className="ml-4"><span className="text-gray-500">  revenue: </span><span className="text-purple-300">0.05</span><span className="text-gray-500">,</span></div>
                  <div><span className="text-gray-500">{String.fromCharCode(125)});</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              Pourquoi développer sur AfriBiz ?
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Un écosystème complet avec tous les outils dont vous avez besoin.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <motion.div key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Créez votre premier module en 5 étapes simples.</p>
          </motion.div>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-start gap-5"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-md shrink-0">
                    {step.number}
                  </div>
                  {i < steps.length - 1 && <div className="w-0.5 h-8 bg-purple-200 dark:bg-purple-800 mt-2" />}
                </div>
                <div className="pt-1.5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-8 sm:p-12 text-center text-white"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/10 rounded-full blur-3xl" />
            <div className="relative">
              <Zap className="h-10 w-10 mx-auto mb-4 text-purple-200" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Prêt à rejoindre l&apos;écosystème ?</h2>
              <p className="text-purple-100/80 max-w-lg mx-auto mb-8">Créez, publiez et monétisez vos modules sur la marketplace panafricaine.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-purple-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-purple-50 hover:shadow-xl transition-all">
                  Créer mon compte développeur <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all">
                  Nous contacter
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
