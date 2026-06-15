'use client';

import Link from 'next/link';
import {
  ArrowRight, Sparkles, ShoppingBag, Calendar, FileText, MessageCircle,
  Check, Star, ChevronRight, ChevronDown, Code, Globe, Smartphone, Shield, Zap,
  Quote, Leaf, TrendingUp, Users, Clock, ChevronLeft, Play, BookOpen,
  CreditCard, Package, Store, Info, Compass,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import AdSlot from '@/components/ads/AdSlot';

// ─── Animation variants ───
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};
const fadeInLeft = { initial: { opacity: 0, x: -40 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.7, ease: 'easeOut' } };
const fadeInRight = { initial: { opacity: 0, x: 40 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: 0.7, ease: 'easeOut' } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };
const staggerItem = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

// ─── Data ───
const stats = [
  { value: '10k+', label: 'Entrepreneurs actifs' },
  { value: '2M+', label: 'Transactions traitées' },
  { value: '50+', label: 'Types de business' },
  { value: '99.9%', label: 'Disponibilité' },
];

const socialProofLogos = [
  { name: 'Kente Création', initials: 'KC', color: 'from-pink-500 to-rose-400' },
  { name: 'Awa Consulting', initials: 'AC', color: 'from-blue-500 to-indigo-400' },
  { name: 'Saveur du Togo', initials: 'ST', color: 'from-amber-500 to-orange-400' },
  { name: 'DesignLab Africa', initials: 'DA', color: 'from-purple-500 to-violet-400' },
  { name: 'TechLomé', initials: 'TL', color: 'from-cyan-500 to-teal-400' },
];

const showcaseItems = [
  { name: 'Kente Création', type: 'Mode & Artisanat', rating: 4.8, sales: '1.2k', verified: true },
  { name: 'Awa Consulting', type: 'Conseil & Stratégie', rating: 4.9, sales: '850', verified: true },
  { name: 'Saveur du Togo', type: 'Restauration', rating: 4.7, sales: '2.1k', verified: true },
  { name: 'TechLomé', type: 'Services IT', rating: 4.6, sales: '630', verified: true },
  { name: 'DesignLab Africa', type: 'Design & Créa', rating: 4.9, sales: '1.5k', verified: true },
  { name: 'GreenHome Togo', type: 'Décoration', rating: 4.5, sales: '420', verified: false },
  { name: 'Santé Plus', type: 'Services médicaux', rating: 4.8, sales: '970', verified: true },
  { name: 'EduKids Africa', type: 'Éducation', rating: 4.7, sales: '1.8k', verified: true },
];

const modules = [
  { icon: ShoppingBag, title: 'E-Commerce', description: 'Vendez des produits avec gestion des stocks et commandes.', color: 'from-emerald-500 to-teal-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', iconColor: 'text-emerald-600', features: ['Gestion des stocks', 'Catalogue illimité', 'Paiements Mobile Money', 'Suivi des commandes'], size: 'large' as const },
  { icon: Calendar, title: 'Réservations', description: 'Pour prestataires : coiffeurs, coachs, consultants.', color: 'from-blue-500 to-indigo-400', bgColor: 'bg-blue-50 dark:bg-blue-950/30', iconColor: 'text-blue-600', features: ['Calendrier interactif', 'Rappels automatiques', 'Disponibilités temps réel', 'Annulation facile'], size: 'medium' as const },
  { icon: FileText, title: 'Facturation', description: 'Générez fiches, factures et reçus PDF.', color: 'from-violet-500 to-purple-400', bgColor: 'bg-violet-50 dark:bg-violet-950/30', iconColor: 'text-violet-600', features: ['Factures PDF', 'Devis personnalisés', 'Suivi des paiements', 'Historique complet'], size: 'medium' as const },
  { icon: MessageCircle, title: 'Marketing & SMS', description: 'Relancez clients directement sur leur téléphone.', color: 'from-amber-500 to-orange-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30', iconColor: 'text-amber-600', features: ['Campagnes SMS', 'Relance automatique', 'Statistiques', 'Segmentation clients'], size: 'medium' as const },
  { icon: Package, title: 'Location', description: 'Gérez la location de biens (voitures, appareils, salles).', color: 'from-rose-500 to-pink-400', bgColor: 'bg-rose-50 dark:bg-rose-950/30', iconColor: 'text-rose-600', features: ['Catalogue locations', 'Calendrier dispo', 'Tarification flexible', 'Contrats automatiques'], size: 'small' as const },
  { icon: Users, title: 'Événements', description: 'Créez des événements et vendez vos billets en ligne.', color: 'from-cyan-500 to-teal-400', bgColor: 'bg-cyan-50 dark:bg-cyan-950/30', iconColor: 'text-cyan-600', features: ['Billetterie en ligne', 'Gestion invités', 'Programme interactif', 'Notifications'], size: 'small' as const },
];

const pricingPlans = [
  { name: 'Gratuit', price: '0', period: '/mois', description: 'Pour démarrer sans risque', popular: true, highlight: 'Recommandé', features: ['Profil business public complet', 'Produits, services et réservations', 'Paiements Mobile Money (Wave, TMoney, Flooz)', 'Système Escrow (tiers de confiance)', 'Tous les modules de gestion', 'Support communautaire'], cta: 'Commencer gratuitement', href: '/signup' },
  { name: 'Copilot IA', price: 'Bientôt', period: '', description: 'Assistant intelligent IA', popular: false, highlight: 'À venir', features: ['Alertes WhatsApp automatiques', 'Prédiction des ruptures de stock', 'Analyse des pics de vente', 'Recommandations personnalisées', 'Rapports intelligents', 'Gestion prédictive'], cta: 'Être notifié', href: '/signup' },
  { name: 'Développeur', price: 'Gratuit', period: '', description: 'Pour bâtir l\'écosystème', popular: false, highlight: 'Écosystème', features: ['Accès API REST complet', 'Documentation technique', 'Publication de modules', 'Sandbox de test', 'Revenue sharing 80/20', 'Support technique dédié'], cta: 'Rejoindre l\'espace Dev', href: '/signup' },
];

const faqs = [
  { q: 'Puis-je utiliser AfriBiz uniquement depuis mon smartphone ?', a: 'Oui ! AfriBiz est conçu mobile-first. Gérez votre boutique, commandes et paiements depuis n\'importe quel smartphone.' },
  { q: 'Comment sont gérés les paiements ?', a: 'Nous intégrons Mobile Money (Orange Money, MTN MoMo, Free Money), transferts bancaires et cartes. Les fonds sont sécurisés via Escrow et reversés sous 48h.' },
  { q: 'Est-ce vraiment gratuit pour commencer ?', a: 'Absolument ! Le plan Gratuit est gratuit à vie sans engagement. Pas d\'abonnement. Vous ne payez que 1% de commission uniquement sur vos ventes.' },
  { q: 'Puis-je vendre depuis plusieurs pays africains ?', a: 'Oui, AfriBiz supporte les transactions multi-pays avec les moyens de paiement locaux de chaque pays.' },
  { q: 'Comment fonctionne l\'espace développeur ?', a: 'Créez des modules personnalisés, intégrations, thèmes et outils. Gagnez de l\'argent à chaque utilisation par les business.' },
];

const testimonials = [
  { quote: 'AfriBiz a transformé notre gestion des commandes. +40% de ventes en 3 mois.', author: 'Amadou Diallo', role: 'Gérant, TogoTech SARL', rating: 5 },
  { quote: 'La solution idéale pour les PME africaines. L\'intégration Mobile Money a tout changé.', author: 'Fatoumata Sy', role: 'Fondatrice, BeautyPro Lomé', rating: 5 },
  { quote: 'Plateforme complète et intuitive. Le support client est exceptionnel.', author: 'Jean-Pierre Koffi', role: 'CEO, AfricaDesign', rating: 5 },
];

function SectionLabel({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand dark:text-brand-400 rounded-full text-xs sm:text-sm font-medium border border-brand/10 dark:border-brand/20 shadow-sm mb-5">
      <Sparkles className="h-3.5 w-3.5" />{text}
    </motion.div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
    </div>
  );
}

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [autoplay, setAutoplay] = useState(true);

  const carouselItems = [...showcaseItems, ...showcaseItems];

  // Auto-scroll carousel with seamless reset
  useEffect(() => {
    if (!autoplay || !carouselRef.current) return;
    const interval = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth / 2;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'instant' });
      }
      el.scrollBy({ left: 320, behavior: 'smooth' });
    }, 3500);
    return () => clearInterval(interval);
  }, [autoplay]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Header />

      {/* HERO */}
      <section className="relative pt-36 pb-24 sm:pt-40 sm:pb-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(5,150,105,0.12),_transparent_50%)]" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[rgba(5,150,105,0.06)] rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 dark:bg-brand-950/40 text-brand dark:text-brand-400 rounded-full text-sm font-medium mb-6 border border-brand/10 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />La plateforme SaaS no.1 pour l&apos;Afrique
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
                Propulsez votre <span className="gradient-text">business</span><br />depuis chez vous.
              </h1>
              <p className="mt-5 text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                La plateforme tout-en-un pour les entrepreneurs africains. Vendez vos produits, gérez vos rendez-vous et encaissez vos paiements en toute simplicité.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3 mt-8">
                <Link href="/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-brand to-emerald-400 text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:shadow-xl hover:shadow-brand/25 transition-all duration-200 group">
                  Commencer gratuitement<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/preview" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm">
                  <Play className="h-4 w-4" />Voir un exemple
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm">
                  Contact
                </Link>
              </div>
              {/* Trust bar */}
              <div className="flex items-center gap-3 mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex -space-x-2">
                  {['KD', 'AS', 'ST', 'TL'].map((init, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-[10px] font-bold">{init}</div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-500">+5k</div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold text-gray-900 dark:text-gray-100">+10 000</span> entrepreneurs nous font confiance</p>
              </div>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-emerald-400" /></div>
                  <div className="flex-1 mx-4"><div className="bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-400 text-center truncate border border-gray-200 dark:border-gray-600">maboutique.afribiz.app/dashboard</div></div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[{ label: 'Ventes', value: '€1,240', change: '+12%', up: true }, { label: 'Clients', value: '89', change: '+8%', up: true }, { label: 'Commandes', value: '34', change: '-3%', up: false }].map((stat) => (
                      <div key={stat.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
                        <span className={`text-xs font-medium ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>{stat.change}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[{ name: 'Chemise Kente', price: '€25.00', status: 'Livré' }, { name: 'Huile de Karité', price: '€12.50', status: 'En cours' }, { name: 'Sac Tissé Main', price: '€35.00', status: 'En attente' }].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                        <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700" /><p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</p></div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{item.price}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'Livré' ? 'bg-emerald-50 text-emerald-700' : item.status === 'En cours' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating phone */}
              <div className="absolute -bottom-6 -right-6 w-32 h-52 bg-gray-900 dark:bg-gray-700 rounded-2xl border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden hidden sm:block">
                <div className="p-2"><div className="w-full h-3 rounded-full bg-gray-700 mb-2" /><div className="space-y-1.5"><div className="w-3/4 h-2 rounded bg-emerald-500/30" /><div className="w-1/2 h-2 rounded bg-gray-600" /><div className="w-2/3 h-2 rounded bg-gray-600" /></div></div>
              </div>
              <div className="absolute -top-4 -left-4 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700 hidden sm:block">
                <div className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5 text-brand" /><span className="text-xs font-medium">Mobile-first</span></div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 sm:mt-20 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center group">
                <p className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-10 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 uppercase tracking-wider font-medium">
            Déjà +10 000 entrepreneurs, artisans et freelances nous font confiance en Afrique
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {socialProofLogos.map((logo) => (
              <div key={logo.name} className="flex items-center gap-2.5 group">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${logo.color} flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-110 transition-transform`}>{logo.initials}</div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS CAROUSEL */}
      <section className="py-20 px-4 overflow-hidden bg-white dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp}><SectionLabel text="Marketplace" /><SectionHeading title="Business en vedette" subtitle="Découvrez des boutiques créées sur AfriBiz." /></motion.div>
          <div className="relative">
            <button onClick={() => scrollCarousel('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all -ml-5 hidden sm:flex"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => scrollCarousel('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all -mr-5 hidden sm:flex"><ChevronRight className="h-5 w-5" /></button>
            <div ref={carouselRef} onMouseEnter={() => setAutoplay(false)} onMouseLeave={() => setAutoplay(true)} className="flex gap-5 overflow-x-auto scrollbar-none py-2 px-1 snap-x snap-mandatory">
              {carouselItems.map((item, i) => (
                <div key={`${item.name}-${i}`} className="min-w-[260px] sm:min-w-[280px] snap-start">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group">
                    <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-xl bg-white/80 dark:bg-gray-700/80 flex items-center justify-center shadow-sm"><Store className="h-6 w-6 text-brand" /></div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1"><h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{item.name}</h3>{item.verified && <span className="badge-success text-[10px] px-1.5 py-0.5">Vérifié</span>}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.type}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="text-xs font-medium text-gray-700">{item.rating}</span><span className="text-xs text-gray-400">· {item.sales} ventes</span></div>
                        <span className="text-xs font-medium text-brand group-hover:gap-1.5 transition-all inline-flex items-center gap-0.5">Visiter <ChevronRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOMEPAGE AD */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <AdSlot page="HOMEPAGE" position="TOP_BANNER" />
      </section>

      {/* MODULES BENTO GRID */}
      <section className="py-20 sm:py-28 px-4 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp}><SectionLabel text="Modules" /><SectionHeading title="Activez les modules dont votre entreprise a besoin" subtitle="Une approche modulaire : choisissez les fonctionnalités qui correspondent à votre activité." /></motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isLarge = mod.size === 'large';
              return (
                <motion.div key={mod.title} variants={staggerItem} className={`relative group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 ${isLarge ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.color}`} />
                  <div className={`p-5 sm:p-6 ${isLarge ? 'sm:p-7' : ''}`}>
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${mod.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}><Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${mod.iconColor}`} /></div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{mod.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{mod.description}</p>
                    <ul className="space-y-1.5">{mod.features.map((feat) => (<li key={feat} className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400"><Check className="h-3.5 w-3.5 text-brand shrink-0" />{feat}</li>))}</ul>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* DEVELOPER ECOSYSTEM */}
      <section className="py-20 sm:py-28 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div {...fadeInLeft}>
              <SectionLabel text="Développeurs" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">Bâtie par des développeurs,<br /><span className="gradient-text-purple">pour l&apos;Afrique</span></h2>
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-6">Vous êtes développeur ? Créez des modules personnalisés — moyens de paiement locaux, outils de livraison, thèmes visuels — et gagnez de l&apos;argent à chaque utilisation.</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[{ icon: Code, label: 'API REST puissante', color: 'text-purple-500' }, { icon: BookOpen, label: 'Documentation complète', color: 'text-blue-500' }, { icon: CreditCard, label: 'Revenue sharing', color: 'text-emerald-500' }, { icon: Globe, label: 'Marché panafricain', color: 'text-amber-500' }].map((benefit) => {
                  const BIcon = benefit.icon;
                  return (<div key={benefit.label} className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><BIcon className={`h-4 w-4 ${benefit.color}`} /></div><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{benefit.label}</span></div>);
                })}
              </div>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-xl text-sm font-semibold hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-200 group">
                Rejoindre l&apos;espace Développeur<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div {...fadeInRight} className="relative">
              <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-950 dark:bg-gray-900 border-b border-gray-800">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /></div>
                  <span className="text-xs text-gray-500 ml-2">api/afribiz.js</span>
                </div>
                <div className="p-5 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed">
                  <div><span className="text-purple-400">import</span><span className="text-gray-300">{String.fromCharCode(123)} </span><span className="text-cyan-300">AfriBizAPI</span><span className="text-gray-300">{String.fromCharCode(125)} </span><span className="text-purple-400">from</span><span className="text-emerald-300"> '@afribiz/sdk'</span><span className="text-gray-500">;</span></div>
                  <div className="mt-2"><span className="text-purple-400">const</span><span className="text-gray-300"> api = </span><span className="text-purple-400">new</span><span className="text-cyan-300"> AfriBizAPI</span><span className="text-gray-500">(</span></div>
                  <div className="ml-4"><span className="text-gray-500">  apiKey: </span><span className="text-emerald-300">'afribiz_sk_...'</span><span className="text-gray-500">,</span></div>
                  <div className="ml-4"><span className="text-gray-500">  region: </span><span className="text-emerald-300">'africa-west'</span><span className="text-gray-500">,</span></div>
                  <div><span className="text-gray-500">);</span></div>
                  <div className="mt-3"><span className="text-gray-500">// Créer un module de paiement</span></div>
                  <div className="mt-1"><span className="text-purple-400">const</span><span className="text-gray-300"> payment = </span><span className="text-purple-400">await</span><span className="text-gray-300"> api</span><span className="text-gray-500">.</span><span className="text-cyan-300">createModule</span><span className="text-gray-500">(</span><span className="text-gray-500">{String.fromCharCode(123)}</span></div>
                  <div className="ml-4"><span className="text-gray-500">  name: </span><span className="text-emerald-300">'Orange Money Pro'</span><span className="text-gray-500">,</span></div>
                  <div className="ml-4"><span className="text-gray-500">  revenue: </span><span className="text-purple-300">0.05</span><span className="text-gray-500">,</span></div>
                  <div><span className="text-gray-500">{String.fromCharCode(125)});</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 sm:py-28 px-4 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp}><SectionLabel text="Tarifs" /><SectionHeading title="Des tarifs adaptés à votre croissance" subtitle="Commencez gratuitement. Pas de carte bancaire requise." /></motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 sm:p-8 flex flex-col ${plan.popular ? 'border-brand shadow-card-hover scale-[1.02] md:scale-105 z-10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'} transition-all duration-300`}>
                {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-emerald-400 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-brand/20">{plan.highlight}</div>}
                {!plan.popular && plan.highlight && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-5 py-1.5 rounded-full">{plan.highlight}</div>}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1"><span className="text-4xl font-bold text-gray-900 dark:text-gray-100">{plan.price}</span>{plan.period && <span className="text-gray-500 dark:text-gray-400 text-sm">{plan.period}</span>}</div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">{plan.features.map((f) => (<li key={f} className="flex items-start gap-2.5"><Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? 'text-brand' : plan.name === 'Développeur' ? 'text-purple-500' : 'text-gray-400'}`} /><span className="text-sm text-gray-600 dark:text-gray-400">{f}</span></li>))}</ul>
                <Link href={plan.href} className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${plan.popular ? 'bg-gradient-to-r from-brand to-emerald-400 text-white hover:shadow-xl hover:shadow-brand/25' : plan.name === 'Développeur' ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:shadow-xl' : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 border border-gray-200'}`}>
                  {plan.cta}<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp}><SectionLabel text="Témoignages" /><SectionHeading title="Ce que disent nos entrepreneurs" subtitle="Rejoignez les milliers d'entrepreneurs qui transforment leur activité." /></motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div key={t.author} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-card-hover transition-all duration-300">
                <Quote className="h-8 w-8 text-brand/20 dark:text-brand/10 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-1 mb-3">{Array.from({ length: t.rating }).map((_, j) => (<Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />))}</div>
                <div><p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.author}</p><p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 px-4 bg-gray-50/50 dark:bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeInUp}><SectionLabel text="FAQ" /><SectionHeading title="Questions fréquentes" subtitle="Tout ce que vous devez savoir avant de commencer." /></motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:border-gray-300 dark:hover:border-gray-600">
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="flex items-center justify-between w-full px-5 sm:px-6 py-4 sm:py-5 text-left">
                  <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 pr-4">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>{activeFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-4 sm:pb-5"><p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p></div>
                  </motion.div>
                )}</AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-emerald-700 to-emerald-900 p-8 sm:p-12 text-center text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium mb-6 border border-white/10"><Zap className="h-3.5 w-3.5" />Prêt à commencer ?</div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Prêt à transformer votre business ?</h2>
              <p className="text-emerald-100/80 max-w-lg mx-auto mb-8 text-base sm:text-lg leading-relaxed">Rejoignez la communauté AfriBiz. C&apos;est gratuit pour commencer.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-brand px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-emerald-50 hover:shadow-xl transition-all duration-200 group">
                  Commencer gratuitement<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all duration-200">Nous contacter</Link>
              </div>
              <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 text-xs text-emerald-200/70">
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />Sans carte bancaire</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />Gratuit à vie</span>
                <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />Annulation à tout moment</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
