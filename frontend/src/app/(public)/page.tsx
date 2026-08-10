'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Store,
  Smartphone,
  Shield,
  TrendingUp,
  Users,
  ShoppingBag,
  BarChart3,
  CheckCircle2,
  Star,
  Play,
  MessageCircle,
  Globe2,
  Zap,
  Sparkles,
  Building2,
  HeadphonesIcon,
  Truck,
  Wallet,
  Percent,
  Bot,
  Landmark,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import AdSlot from '@/components/ads/AdSlot';

// ─── Animations ────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -40 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};

const fadeInRight = {
  initial: { opacity: 0, x: 40 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: 'easeOut' },
};

// ─── Data ──────────────────────────────────────────────────

const stats = [
  { icon: Store, value: '500+', label: 'Commerçants actifs' },
  { icon: Users, value: '10 000+', label: 'Clients servis' },
  { icon: TrendingUp, value: '50M+', label: 'FCFA de transactions' },
  { icon: Globe2, value: '5', label: 'Pays couverts' },
];

const features = [
  {
    icon: Store,
    title: 'Boutique en ligne',
    desc: 'Créez votre boutique digitale en quelques minutes. Publiez produits, services et gérez vos ventes sans aucune connaissance technique.',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Smartphone,
    title: 'Paiements Mobile Money',
    desc: 'Acceptez Wave, TMoney, Flooz, Moov Money et cartes bancaires. Vos clients paient depuis leur téléphone sans frais.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Shield,
    title: 'Paiement Sécurisé Escrow',
    desc: "L'argent est séquestré jusqu'à confirmation de livraison. Acheteurs et vendeurs sont protégés contre les arnaques.",
    color: 'from-purple-500 to-violet-400',
  },
  {
    icon: BarChart3,
    title: 'Statistiques & Rapports',
    desc: 'Suivez vos ventes, commandes et tendances avec des tableaux de bord clairs et des rapports détaillés.',
    color: 'from-orange-500 to-amber-400',
  },
  {
    icon: MessageCircle,
    title: 'Messagerie Intégrée',
    desc: 'Communiquez directement avec vos clients via la messagerie intégrée et les notifications WhatsApp automatiques.',
    color: 'from-pink-500 to-rose-400',
  },
  {
    icon: Truck,
    title: 'Gestion des Livraisons',
    desc: 'Gérez vos livraisons, suivez les colis en temps réel et tenez vos clients informés à chaque étape.',
    color: 'from-indigo-500 to-blue-400',
  },
  {
    icon: Wallet,
    title: 'Portefeuille Digital',
    desc: 'Un portefeuille intégré pour gérer vos fonds, suivre vos transactions et effectuer des retraits en toute simplicité.',
    color: 'from-green-500 to-emerald-400',
  },
  {
    icon: Percent,
    title: '1% de Commission',
    desc: "Pas d'abonnement mensuel. Prélevez seulement 1% sur chaque transaction réussie. Si vous ne vendez pas, vous ne payez rien.",
    color: 'from-red-500 to-rose-400',
  },
  {
    icon: Bot,
    title: 'Copilot IA (Bientôt)',
    desc: 'Un assistant intelligent qui analyse vos ventes, prédit les ruptures de stock et vous envoie des alertes WhatsApp.',
    color: 'from-purple-500 to-indigo-400',
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'Créez votre compte',
    desc: "Inscrivez-vous gratuitement en 2 minutes. Pas de carte bancaire, pas d'engagement.",
    icon: UserPlus,
  },
  {
    step: '2',
    title: 'Configurez votre boutique',
    desc: 'Ajoutez vos produits, services, horaires et photos. Personnalisez votre page business.',
    icon: Store,
  },
  {
    step: '3',
    title: 'Vendez & encaissez',
    desc: 'Recevez les paiements Mobile Money. Gérez les commandes et les livraisons.',
    icon: ShoppingBag,
  },
  {
    step: '4',
    title: 'Développez votre activité',
    desc: 'Analysez vos performances, fidélisez vos clients et développez votre réseau.',
    icon: TrendingUp,
  },
];

const testimonials = [
  {
    name: 'Aminata Diallo',
    role: 'Vendeuse de tissus, Dakar',
    avatar: 'AD',
    content:
      'Avant AfriBiz, je vendais uniquement dans mon quartier. Maintenant, mes clients viennent de tout le Sénégal et même de la diaspora. Le paiement Mobile Money a changé ma vie.',
    rating: 5,
  },
  {
    name: 'Koffi Mensah',
    role: 'Restaurateur, Lomé',
    avatar: 'KM',
    content:
      'La gestion des réservations et des commandes est devenue tellement plus simple. Mes clients adorent pouvoir réserver en ligne et payer par TMoney. Je recommande à 100%.',
    rating: 5,
  },
  {
    name: 'Fatoumata Traoré',
    role: 'Coiffeuse professionnelle, Bamako',
    avatar: 'FT',
    content:
      "Le système de réservation en ligne m'a permis d'organiser mon emploi du temps et de réduire les annulations. J'ai doublé mon chiffre d'affaires en 3 mois.",
    rating: 5,
  },
  {
    name: 'Jean-Pierre Kabongo',
    role: 'Épicier, Kinshasa',
    avatar: 'JP',
    content:
      "J'ai commencé avec la formule gratuite et j'ai tout de suite vu la différence. La gestion des stocks et les alertes WhatsApp me font gagner un temps fou.",
    rating: 5,
  },
];

const modules = [
  {
    icon: Store,
    title: 'E-Commerce',
    desc: 'Boutique en ligne complète avec catalogue, panier et commandes.',
    popular: true,
  },
  {
    icon: Calendar,
    title: 'Réservations',
    desc: 'Système de prise de rendez-vous avec calendrier et rappels automatiques.',
    popular: false,
  },
  {
    icon: FileText,
    title: 'Facturation',
    desc: 'Générez des devis et factures professionnels en un clic.',
    popular: false,
  },
  {
    icon: Users,
    title: 'CRM',
    desc: 'Gérez vos clients, suivez leurs historiques et fidélisez-les.',
    popular: false,
  },
  {
    icon: BarChart3,
    title: 'Analytiques',
    desc: 'Statistiques détaillées sur vos ventes et votre croissance.',
    popular: false,
  },
  {
    icon: MessageCircle,
    title: 'Marketing',
    desc: 'Campagnes SMS, notifications et promotions automatisées.',
    popular: false,
  },
  {
    icon: Truck,
    title: 'Livraisons',
    desc: 'Gestion complète des expéditions et suivi en temps réel.',
    popular: false,
  },
  {
    icon: Bot,
    title: 'Copilot IA',
    desc: 'Assistant intelligent pour optimiser vos décisions.',
    popular: false,
  },
  {
    icon: CalendarDays,
    title: 'Événements',
    desc: 'Organisez et vendez des billets pour vos événements.',
    popular: false,
  },
  {
    icon: Building2,
    title: 'Employés',
    desc: 'Gérez vos équipes, leurs horaires et leurs commissions.',
    popular: false,
  },
  {
    icon: Wallet,
    title: 'Portefeuille',
    desc: "Gérez vos fonds, retraits et transactions en un clin d'œil.",
    popular: false,
  },
  {
    icon: Landmark,
    title: 'Comptabilité',
    desc: 'Suivez vos dépenses, revenus et bénéfices facilement.',
    popular: false,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

function StatValue({ value, suffix = '' }: { value: string; suffix?: string }) {
  return (
    <span className="text-3xl sm:text-4xl font-bold text-white">
      {value}
      {suffix}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      {/* ════════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background avec gradient et pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(5,150,105,0.08)_0%,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(5,150,105,0.12)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(5,150,105,0.05)_0%,_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(5,150,105,0.08)_0%,_transparent_50%)]" />

        {/* Formes décoratives */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 w-full"
        >
          <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left — Texte */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium mb-6 border border-emerald-200/50 dark:border-emerald-800/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  La plateforme tout-en-un pour les entrepreneurs africains
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.1] mb-6">
                  Votre business en ligne,
                  <br />
                  <span className="bg-gradient-to-r from-brand via-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                    simplifié pour l&apos;Afrique
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-xl">
                  Créez votre boutique en ligne, acceptez les paiements Mobile Money, gérez vos
                  commandes et développez votre activité — le tout gratuitement, sans abonnement.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand to-emerald-400 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-brand/25 transition-all duration-200 group"
                  >
                    Commencer gratuitement
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-brand/50 hover:text-brand transition-all duration-200"
                  >
                    <Play className="h-5 w-5" />
                    Voir la marketplace
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-6 mt-8 text-sm text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-brand" />
                    Gratuit
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-brand" />
                    Mobile Money
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-brand" />
                    Sans engagement
                  </span>
                </div>
              </motion.div>

              {/* Right — Visuel / Dashboard preview */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                className="relative"
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl shadow-brand/5 overflow-hidden">
                  {/* Mockup header */}
                  <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs text-gray-400 font-medium">
                      dashboard.afribiz.com
                    </span>
                  </div>
                  {/* Mockup content */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Solde disponible</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          245 000 FCFA
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                        A
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Ventes', value: '34', color: 'bg-emerald-500' },
                        { label: 'Clients', value: '28', color: 'bg-blue-500' },
                        { label: 'Avis', value: '4.8', color: 'bg-amber-500' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center"
                        >
                          <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-1`} />
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {item.value}
                          </p>
                          <p className="text-xs text-gray-400">{item.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-brand to-emerald-400 rounded-full" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      Objectif mensuel : 75% atteint
                    </p>
                  </div>
                </div>

                {/* Badges flottants */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      +127%
                    </span>
                    <span className="text-xs text-gray-400">de croissance</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-brand" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">Wave + TMoney</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PUB - Hero sponsorisé */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdSlot page="HOMEPAGE" position="HERO_BANNER" />
      </div>

      {/* ════════════════════════════════════════════════════════
          STATS SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="relative py-16 bg-gradient-to-r from-brand via-brand-700 to-emerald-800 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={staggerItem} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <StatValue value={stat.value} />
                  <p className="text-emerald-100/80 text-sm mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURES SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand/5 text-brand rounded-full text-sm font-medium mb-4 border border-brand/10">
              <Sparkles className="h-3.5 w-3.5" />
              Tout ce dont vous avez besoin
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              Une plateforme complète pour votre business
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Gérez votre entreprise de A à Z : boutique en ligne, paiements, livraisons, marketing
              et analyse — le tout dans une interface unique et intuitive.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={staggerItem}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-card-hover hover:border-brand/20 transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* PUB - Bloc mis en avant */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdSlot page="HOMEPAGE" position="FEATURED_BLOCK" />
      </div>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Rejoindre AfriBiz et lancer votre activité en ligne prend moins de 5 minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative text-center"
                >
                  {/* Ligne de connexion */}
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-brand/30 to-brand/10" />
                  )}

                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand/20">
                    <Icon className="h-7 w-7 text-white" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border-2 border-brand flex items-center justify-center">
                      <span className="text-xs font-bold text-brand">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          MODULES SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand/5 text-brand rounded-full text-sm font-medium mb-4 border border-brand/10">
              <Building2 className="h-3.5 w-3.5" />
              Tous les modules inclus
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              Des modules pour chaque besoin
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Que vous soyez commerçant, restaurateur, prestataire de services ou artisan, AfriBiz
              s&apos;adapte à votre activité.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <motion.div
                  key={mod.title}
                  variants={staggerItem}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl border p-5 transition-all duration-200 hover:shadow-card-hover ${
                    mod.popular
                      ? 'border-brand ring-1 ring-brand/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {mod.popular && (
                    <div className="absolute -top-2 -right-2 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Populaire
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-brand/5 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{mod.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium mb-4 border border-amber-200/50 dark:border-amber-800/30">
              <Star className="h-3.5 w-3.5" />
              Ils nous font confiance
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Des centaines d&apos;entrepreneurs africains utilisent AfriBiz au quotidien.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-card-hover transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white font-bold shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                  <StarRating rating={testimonial.rating} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PUB - Bandeau bas */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdSlot page="HOMEPAGE" position="BOTTOM_BANNER" />
      </div>

      {/* ════════════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-700 to-emerald-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(5,150,105,0.3)_0%,_transparent_50%)]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div {...scaleIn}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white rounded-full text-sm font-medium mb-6 border border-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              Rejoignez la communauté AfriBiz
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Prêt à transformer votre activité ?
            </h2>
            <p className="text-lg text-emerald-100/80 mb-8 max-w-2xl mx-auto">
              Rejoignez des centaines d&apos;entrepreneurs africains qui utilisent déjà AfriBiz pour
              développer leur business. Gratuit, sans engagement, sans carte bancaire.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-brand font-bold px-8 py-4 rounded-xl text-lg hover:bg-emerald-50 transition-all shadow-xl shadow-black/20 group"
              >
                Créer mon compte gratuit
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold border border-white/20 hover:bg-white/20 transition-all"
              >
                <HeadphonesIcon className="h-5 w-5" />
                Nous contacter
              </Link>
            </div>
            <p className="text-emerald-200/60 text-sm mt-6">
              0 FCFA à l&apos;inscription · 1% commission seulement sur les ventes · Pas
              d&apos;engagement
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// Helper to avoid Calendar conflict with lucide
function Calendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function FileText({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function CalendarDays({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}

function UserPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
