'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowRight, Check, Star, Sparkles, ShoppingBag, Calendar,
  FileText, Users, BarChart3, Shield, Zap,
  Smartphone, Globe, CreditCard, TrendingUp, Package, Wallet,
  Bell, Play,
  LayoutDashboard, Lightbulb, Target, Rocket,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const onboardingSteps = [
  {
    icon: LayoutDashboard,
    title: 'Créez votre profil business',
    desc: 'Ajoutez votre nom, logo, description, horaires et contact. C\'est la première impression que vos clients auront de vous.',
    color: 'from-emerald-500 to-teal-400',
    example: 'Ma Boutique · Lomé, Togo · ⭐ 4.8 (120 avis)',
  },
  {
    icon: Target,
    title: 'Activez vos modules',
    desc: 'E-Commerce, Réservations, Facturation, Marketing SMS… Activez seulement ce dont vous avez besoin. Chaque module débloque des fonctionnalités puissantes.',
    color: 'from-blue-500 to-indigo-400',
    example: 'Modules actifs : E-Commerce ✅ · Réservations ✅ · Facturation ✅',
  },
  {
    icon: Lightbulb,
    title: 'Ajoutez vos produits & services',
    desc: 'Photos, descriptions, prix, stocks. Votre catalogue en ligne est votre vitrine 24h/24, 7j/7. Visible sur mobile et desktop.',
    color: 'from-amber-500 to-orange-400',
    example: '1 240 visiteurs ce mois · 89 commandes · +12% vs mois dernier',
  },
  {
    icon: Rocket,
    title: 'Activez les paiements Mobile Money',
    desc: 'Orange Money, MTN MoMo, T-Money, Flooz, Wave… Vos clients paient en 1 clic depuis leur téléphone. Les fonds sont sécurisés.',
    color: 'from-purple-500 to-violet-400',
    example: '34 ventes ce mois · 1 240 000 FCFA de chiffre d\'affaires',
  },
];

const kpiData = [
  { icon: ShoppingBag, label: 'Ventes du jour', value: '234 000 FCFA', change: '+12%', up: true, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Users, label: 'Clients', value: '89 nouveaux', change: '+8%', up: true, color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Package, label: 'Commandes', value: '34', change: '+15%', up: true, color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Star, label: 'Avis clients', value: '4.8 ⭐', change: '120 avis', up: true, color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: Wallet, label: 'Revenu mensuel', value: '1 240 000 FCFA', change: '+22%', up: true, color: 'text-brand', bg: 'bg-brand-50' },
  { icon: Bell, label: 'Notifications', value: '3', change: '2 non lues', up: false, color: 'text-red-600', bg: 'bg-red-50' },
];

const recentOrders = [
  { id: '#CMD-0042', client: 'Awa Diallo', product: 'Chemise Kente', amount: '25 000 FCFA', status: 'Livré', statusColor: 'bg-emerald-50 text-emerald-700' },
  { id: '#CMD-0041', client: 'Koffi Mensah', product: 'Huile de Karité', amount: '12 500 FCFA', status: 'En cours', statusColor: 'bg-blue-50 text-blue-700' },
  { id: '#CMD-0040', client: 'Fatima Sy', product: 'Sac Tissé Main', amount: '35 000 FCFA', status: 'En attente', statusColor: 'bg-amber-50 text-amber-700' },
  { id: '#CMD-0039', client: 'Jean K.', product: 'Set de 3 Bougies', amount: '8 500 FCFA', status: 'Livré', statusColor: 'bg-emerald-50 text-emerald-700' },
];

const features = [
  { icon: Smartphone, title: 'Mobile-first', desc: 'Gérez votre business depuis n\'importe quel smartphone' },
  { icon: Globe, title: 'Page publique', desc: 'Votre vitrine en ligne avec domaine personnalisé' },
  { icon: CreditCard, title: 'Paiements locaux', desc: 'Mobile Money, cartes, espèces — vos clients choisissent' },
  { icon: Shield, title: 'Escrow sécurisé', desc: 'Fonds protégés jusqu\'à confirmation de livraison' },
  { icon: BarChart3, title: 'Statistiques', desc: 'Suivez vos ventes, clients et tendances en temps réel' },
  { icon: Zap, title: 'Automatisations', desc: 'Relances SMS, rappels, factures automatiques' },
];

export default function PreviewPage() {
  const [activeOnboarding, setActiveOnboarding] = useState(0);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      {/* ─── HERO PREVIEW ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(5,150,105,0.08),_transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand dark:text-brand-400 rounded-full text-sm font-medium mb-6 border border-brand/10 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />Aperçu de votre futur dashboard
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
              Voici ce que vous allez <span className="gradient-text">obtenir</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Créez votre compte business, complétez l&apos;onboarding en 5 minutes,
              et accédez à un tableau de bord puissant pour gérer tout votre entreprise.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand to-emerald-400 text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:shadow-xl hover:shadow-brand/25 transition-all duration-200 group">
                Créer mon compte business <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button onClick={() => scrollToSection('dashboard-demo')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm">
                <Play className="h-4 w-4" />Voir le dashboard en action
              </button>
            </div>
          </motion.div>

          {/* Quick stats bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: '5 min', label: 'Temps d\'onboarding' },
              { value: '6 modules', label: 'Disponibles' },
              { value: '7 pays', label: 'Afrique' },
              { value: 'Gratuit', label: 'Pour démarrer' },
            ].map((s, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/30">
                <p className="text-2xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── ONBOARDING STEPS ─── */}
      <section id="onboarding" className="py-20 sm:py-28 px-4 bg-gray-50/50 dark:bg-gray-900/20">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-5 border border-blue-200/50">
              <Target className="h-3.5 w-3.5" />L&apos;onboarding en 4 étapes
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Configurez votre business en <span className="gradient-text">5 minutes</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Chaque étape débloque des fonctionnalités. Prenez le temps de bien renseigner vos informations
              pour offrir la meilleure expérience à vos clients.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Steps list */}
            <div className="space-y-4">
              {onboardingSteps.map((step, i) => {
                const Icon = step.icon;
                const isActive = activeOnboarding === i;
                return (
                  <motion.button
                    key={i}
                    variants={staggerItem}
                    onClick={() => setActiveOnboarding(i)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-brand bg-white dark:bg-gray-800 shadow-lg shadow-brand/5'
                        : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/30 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 ${
                        isActive ? 'scale-110' : ''
                      } transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isActive ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                          }`}>{i + 1}</span>
                          <h3 className={`font-semibold ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{step.desc}</p>
                        {isActive && (
                          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand/10">
                            <p className="text-xs font-medium text-brand">✨ Ce que ça donne :</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{step.example}</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Preview visual */}
            <motion.div key={activeOnboarding} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                <div className="flex-1 mx-2"><div className="bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 text-center truncate border border-gray-200 dark:border-gray-600">maboutique.afribiz.app</div></div>
              </div>
              <div className="p-6">
                {activeOnboarding === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white text-xl font-bold">MB</div>
                      <div><p className="text-lg font-bold text-gray-900 dark:text-gray-100">Ma Boutique</p><p className="text-sm text-gray-500">Lomé, Togo · ouverte depuis janvier 2025</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['Lun-Ven: 08h-19h', 'Sam: 09h-17h'].map((h) => (
                        <div key={h} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-400">{h}</div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.8 (120 avis) · Vérifié ✓</div>
                    <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand/20">
                      <p className="text-sm text-brand font-semibold">✅ Profil complété à 100%</p>
                      <p className="text-xs text-gray-500 mt-1">Vos clients voient toutes vos informations. L'onboarding vous guide pas à pas.</p>
                    </div>
                  </div>
                )}
                {activeOnboarding === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">Modules activés <span className="text-brand">● 3 actifs</span></div>
                    <div className="space-y-2">
                      {[
                        { icon: ShoppingBag, name: 'E-Commerce', status: 'Actif', desc: '24 produits · 89 commandes' },
                        { icon: Calendar, name: 'Réservations', status: 'Actif', desc: '15 réservations ce mois' },
                        { icon: FileText, name: 'Facturation', status: 'Actif', desc: '34 factures générées' },
                      ].map((mod) => {
                        const MIcon = mod.icon;
                        return (
                          <div key={mod.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center"><MIcon className="w-4 h-4 text-brand" /></div>
                            <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{mod.name}</p><p className="text-xs text-gray-500">{mod.desc}</p></div>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{mod.status}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50">
                      <p className="text-sm text-blue-700 font-semibold">💡 Conseil onboarding</p>
                      <p className="text-xs text-gray-500 mt-1">Activez uniquement les modules pertinents pour votre activité. Vous pourrez en ajouter plus tard.</p>
                    </div>
                  </div>
                )}
                {activeOnboarding === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[{ label: 'Vues ce mois', value: '1 240' }, { label: 'Paniers', value: '89' }, { label: 'Taux conv.', value: '38%' }].map((s) => (
                        <div key={s.label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Chemise Kente', price: '25 000 FCFA', stock: '12 en stock' },
                        { name: 'Huile de Karité Bio', price: '12 500 FCFA', stock: '8 en stock' },
                        { name: 'Sac Tissé Main', price: '35 000 FCFA', stock: '3 en stock' },
                      ].map((p) => (
                        <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                          <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p><p className="text-xs text-gray-500">{p.stock}</p></div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeOnboarding === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        { label: 'CA du mois', value: '1 240 000 FCFA' },
                        { label: 'Ventes', value: '34' },
                        { label: 'Commission', value: '37 200 FCFA' },
                        { label: 'Encaissements', value: '1 202 800 FCFA' },
                      ].map((s) => (
                        <div key={s.label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                          <p className="text-xs text-gray-500">{s.label}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        { provider: 'Orange Money', amount: '450 000 FCFA', count: '12 tx' },
                        { provider: 'MTN MoMo', amount: '380 000 FCFA', count: '9 tx' },
                        { provider: 'T-Money', amount: '250 000 FCFA', count: '7 tx' },
                        { provider: 'Wave', amount: '160 000 FCFA', count: '6 tx' },
                      ].map((p) => (
                        <div key={p.provider} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                          <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-brand" /><span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.provider}</span></div>
                          <div className="text-right"><span className="text-sm font-semibold">{p.amount}</span><span className="text-xs text-gray-400 ml-2">{p.count}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* CTA between sections */}
          <motion.div {...fadeInUp} className="text-center mt-12 p-8 rounded-2xl bg-gradient-to-r from-brand-50 to-emerald-50 dark:from-brand-950/30 dark:to-emerald-950/30 border border-brand/10">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Prêt à voir votre vrai dashboard ?
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 mt-4 bg-gradient-to-r from-brand to-emerald-400 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand/25 transition-all group">
              Créer mon compte business <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── DASHBOARD DEMO ─── */}
      <section id="dashboard-demo" className="py-20 sm:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium mb-5 border border-purple-200/50">
              <LayoutDashboard className="h-3.5 w-3.5" />Dashboard en action
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Votre tableau de bord <span className="gradient-text">en temps réel</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Tout est conçu pour que vous ayez une vue d&apos;ensemble claire de votre activité.
            </p>
          </motion.div>

          {/* Simulated Dashboard */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
              <div className="flex-1 mx-4"><div className="bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 text-center truncate border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-2">
                <Shield className="h-3 w-3 text-emerald-500" /> maboutique.afribiz.app/dashboard
              </div></div>
              <div className="flex items-center gap-1 text-xs text-gray-400"><Bell className="h-3.5 w-3.5" /><span className="w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center text-[9px] font-bold">3</span></div>
            </div>

            {/* Dashboard content */}
            <div className="p-5 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-50 dark:bg-brand-900/30 rounded-full text-brand text-[10px] font-medium mb-2">
                    <Sparkles className="h-3 w-3" /> Tableau de bord
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bonjour, Koffi 👋</h3>
                  <p className="text-sm text-gray-500">Bienvenue sur votre espace business</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <button className="px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors">
                    <ShoppingBag className="h-4 w-4 inline mr-1.5" />Marketplace
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white text-sm font-semibold shadow-lg shadow-brand/20">
                    Explorer <ArrowRight className="h-4 w-4 inline ml-1" />
                  </button>
                </div>
              </div>

              {/* Profile completion bar - explained */}
              <div className="relative mb-6 group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Profil complété</span>
                  <span className="text-xs font-bold text-brand">85%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand to-emerald-400 rounded-full transition-all duration-500" style={{ width: '85%' }} />
                </div>
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                  ℹ️ Complétez votre profil pour être visible dans la marketplace
                </div>
              </div>

              {/* KPI Cards with explanations */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {kpiData.map((kpi, i) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={i} className="relative p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/50 hover:border-brand/20 hover:shadow-sm transition-all group/kpi cursor-default"
                      onMouseEnter={() => setShowTooltip(i)} onMouseLeave={() => setShowTooltip(null)}>
                      <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                        <Icon className={`w-4 h-4 ${kpi.color}`} />
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5">{kpi.value}</p>
                      <span className={`text-[10px] font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>{kpi.change}</span>
                      {showTooltip === i && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl z-20 whitespace-nowrap">
                          {kpi.label === 'Ventes du jour' ? '📊 Suivez vos performances en temps réel' :
                           kpi.label === 'Clients' ? '👥 Voyez qui achète chez vous' :
                           kpi.label === 'Commandes' ? '📦 Gérez toutes vos commandes' :
                           kpi.label === 'Avis clients' ? '⭐ Répondez aux avis de vos clients' :
                           kpi.label === 'Revenu mensuel' ? '💰 Suivez votre chiffre d\'affaires' :
                           '🔔 Recevez des alertes en direct'}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Recent orders + Notifications */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dernières commandes</h4>
                    <span className="text-[10px] text-brand font-medium cursor-pointer hover:underline">Voir tout →</span>
                  </div>
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group cursor-default">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <ShoppingBag className="w-4 h-4 text-brand" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.client}</p>
                            <p className="text-xs text-gray-500">{order.product} · {order.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.amount}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.statusColor}`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notifications</h4>
                    <span className="w-2 h-2 rounded-full bg-brand animate-pulse-soft" />
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: ShoppingBag, title: 'Nouvelle commande', desc: '#CMD-0042 · 25 000 FCFA', time: 'Il y a 5 min', color: 'text-purple-600', bg: 'bg-purple-50' },
                      { icon: Star, title: 'Nouvel avis 5 ⭐', desc: 'Awa D. : \"Super qualité !\"', time: 'Il y a 12 min', color: 'text-amber-600', bg: 'bg-amber-50' },
                      { icon: Bell, title: 'Rappel : stock faible', desc: 'Sac Tissé Main : 3 restants', time: 'Il y a 1h', color: 'text-red-600', bg: 'bg-red-50' },
                    ].map((notif, i) => {
                      const NIcon = notif.icon;
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-default">
                          <div className={`w-8 h-8 rounded-lg ${notif.bg} flex items-center justify-center shrink-0`}>
                            <NIcon className={`w-3.5 h-3.5 ${notif.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{notif.title}</p>
                            <p className="text-[10px] text-gray-500 truncate">{notif.desc}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {features.map((feat, i) => {
              const FIcon = feat.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FIcon className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{feat.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── WHY ONBOARDING ─── */}
      <section className="py-20 sm:py-28 px-4 bg-gradient-to-br from-brand-50 via-white to-emerald-50 dark:from-brand-950/20 dark:via-gray-900 dark:to-emerald-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium mb-5 border border-emerald-200/50">
              <Lightbulb className="h-3.5 w-3.5" />Pourquoi bien faire l&apos;onboarding ?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-6">
              Un onboarding bien rempli = <span className="gradient-text">un business qui cartonne</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 mt-10">
            {[
              {
                icon: Star,
                title: 'Visibilité maximale',
                desc: 'Un profil complet avec photo, description et horaires est 3x plus consulté. Vous apparaissez dans la marketplace et le moteur de recherche.',
                stat: '+200%',
                statLabel: 'de visites',
              },
              {
                icon: TrendingUp,
                title: 'Confiance clients',
                desc: 'Les clients préfèrent les business vérifiés avec avis, photos et informations détaillées. L\'onboarding vous guide pour tout renseigner.',
                stat: '+150%',
                statLabel: 'de ventes',
              },
              {
                icon: Zap,
                title: 'Fonctionnalités débloquées',
                desc: 'Chaque étape de l\'onboarding débloque des fonctionnalités : paiements, modules, statistiques… Plus vous remplissez, plus vous gagnez en puissance.',
                stat: '100%',
                statLabel: 'des fonctionnalités',
              },
            ].map((item, i) => {
              const BIcon = item.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-black/5 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand/20">
                    <BIcon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-bold gradient-text mb-1">{item.stat}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{item.statLabel}</p>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-emerald-700 to-emerald-900 p-8 sm:p-12 text-center text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium mb-6 border border-white/10">
                <Rocket className="h-3.5 w-3.5" />Prêt à lancer votre business en ligne ?
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                Vous avez vu ce dont vous avez besoin
              </h2>
              <p className="text-emerald-100/80 max-w-lg mx-auto mb-8 text-base sm:text-lg leading-relaxed">
                Maintenant, créez votre compte business et commencez à construire votre succès.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 bg-white text-brand px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-emerald-50 hover:shadow-xl transition-all duration-200 group">
                  Créer mon compte business <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/"
                  className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all duration-200">
                  Retour à l&apos;accueil
                </Link>
              </div>
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 text-xs text-emerald-200/70">
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />Sans carte bancaire</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />5 min d&apos;onboarding</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />Support 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
