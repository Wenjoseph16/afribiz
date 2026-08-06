'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Percent,
  Shield,
  Bot,
  Smartphone,
  BookOpen,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getApiUrl } from '@/lib/config';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return 'Bientôt';
  const n = Number(price);
  if (n === 0) return '0';
  return n.toLocaleString('fr-FR').replace(/\u202f/g, ' ');
};

const staticPlans = [
  {
    key: 'platform-afribiz',
    name: 'AfriBiz',
    price: '0',
    period: 'FCFA',
    description: "L'abonnement unique, tout inclus — GRATUIT pour le lancement",
    icon: Sparkles,
    gradient: 'from-orange-500 to-amber-400',
    features: [
      '100% des modules, sans limite',
      'Paiements Mobile Money (Wave, TMoney, Flooz) + Escrow sécurisé',
      'Commission transaction de 1% seulement quand vous vendez',
      'Commission Escrow de 2% (tiers de confiance)',
      'Copilot IA inclus gratuitement',
      'Analytics avancés + rapports automatiques',
    ],
    footnote: 'Promo de lancement : 0 FCFA/mois (5 000 FCFA/mois après le lancement)',
    cta: 'Commencer gratuitement',
    href: '/signup',
    popular: true,
    badge: '🔥 Promo lancement : gratuit',
  },
  {
    key: 'platform-copilot',
    name: 'Copilot IA',
    price: 'Bientôt',
    period: '',
    description: 'Votre assistant virtuel intelligent — bientôt disponible',
    icon: Bot,
    gradient: 'from-purple-600 to-indigo-500',
    features: [
      'Alertes WhatsApp automatiques',
      'Prédiction des ruptures de stock',
      'Analyse des pics de vente',
      'Recommandations personnalisées',
      'Rapports intelligents',
      'Gestion prédictive',
    ],
    footnote: "Préparé pour le lancement — gratuit pour l'instant",
    cta: 'En savoir plus',
    href: '/signup',
    popular: false,
    badge: '✨ Bientôt disponible',
  },
];

const devPlan = {
  name: 'Développeur',
  price: 'Gratuit',
  period: '',
  description: "Pour bâtir l'écosystème",
  icon: BookOpen,
  gradient: 'from-blue-600 to-cyan-500',
  features: [
    'Accès API REST complet',
    'Documentation technique',
    'Publication de modules',
    'Sandbox de test',
    'Revenue sharing 80/20',
    'Support technique dédié',
  ],
  footnote: 'Vous gardez 80% du prix de vos modules',
  cta: "Rejoindre l'espace Dev",
  href: '/signup?role=developer',
};

const faqs = [
  {
    q: "C'est vraiment gratuit ?",
    a: 'Oui ! AfriBiz est en promo de lancement : le plan est 100% gratuit (0 FCFA/mois). Vous ne payez que lorsque vous vendez : 1% de commission sur chaque transaction réussie via Mobile Money ou carte bancaire.',
  },
  {
    q: "Pas d'abonnement caché ?",
    a: "Aucun abonnement pendant la promo de lancement. Pas de carte bancaire requise pour s'inscrire. Nous prélevons uniquement une micro-commission (1%) sur vos ventes. Si vous ne vendez pas, vous ne payez rien. Après le lancement, AfriBiz passera à 5 000 FCFA/mois.",
  },
  {
    q: "Comment fonctionne l'Escrow ?",
    a: "L'Escrow est notre service de tiers de confiance. Le client paie le montant, AfriBiz le garde en séquestre. Quand le client reçoit et confirme la livraison, les fonds sont libérés. Une commission de 2% est prélevée sur ce service.",
  },
  {
    q: "Et le Copilot IA, c'est payant ?",
    a: "Pour l'instant le Copilot IA est inclus gratuitement avec AfriBiz (promo de lancement). Quand nous intégrerons les vraies IA externes après le lancement, il deviendra une option premium. Vous serez prévenu avant tout changement.",
  },
  {
    q: 'Les développeurs sont payés comment ?',
    a: "Les développeurs publient leurs modules gratuitement sur notre marketplace. Quand un business achète leur module, le développeur reçoit 80% du prix. AfriBiz prend 20% pour l'hébergement et la distribution.",
  },
  {
    q: 'Pourquoi AfriBiz passe-t-il payant après le lancement ?',
    a: "La promo de lancement vise à attirer un maximum de commerçants. Après cette phase, AfriBiz coûtera 5 000 FCFA/mois (tout inclus). Les commissions de 1% sur les transactions et 2% sur l'escrow resteront inchangées, quelle que soit la période.",
  },
];

type PlanCard = (typeof staticPlans)[number];

function mapApiPlan(apiPlan: any): PlanCard | null {
  const match = staticPlans.find((p) => p.key === apiPlan.id);
  if (!match) return null;
  const price = formatPrice(apiPlan.price);
  const commission = apiPlan.privileges?.find((p: any) => p.code === 'COMMISSION_TRANSACTION');
  return {
    ...match,
    price,
    period: Number(apiPlan.price) > 0 ? 'FCFA/mois' : '/mois',
    description: apiPlan.description || match.description,
    features: apiPlan.benefits?.length ? apiPlan.benefits : match.features,
    footnote: commission
      ? `Commission de ${Number(commission.value)}% sur chaque transaction réussie`
      : match.footnote,
    badge: apiPlan.badge || match.badge,
  };
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PlanCard[]>(staticPlans);
  const [liveCommissions, setLiveCommissions] = useState<{
    transaction?: number;
    escrow?: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(getApiUrl('/plans'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('fetch failed'))))
      .then((json) => {
        if (cancelled) return;
        const apiPlans = json?.data?.plans;
        if (Array.isArray(apiPlans) && apiPlans.length > 0) {
          const mapped = apiPlans.map(mapApiPlan).filter(Boolean) as PlanCard[];
          if (mapped.length > 0) {
            // Fusion : on garde les cartes API + les cartes statiques absentes de l'API
            // (ex. Copilot « Bientôt » n'est pas vendu → isPublic=false → absent de l'API)
            setPlans([
              ...mapped,
              ...staticPlans.filter((p) => !mapped.some((m) => m.key === p.key)),
            ]);
          }
        }
        if (json?.data?.commissions) {
          setLiveCommissions({
            transaction: json.data.commissions.transaction,
            escrow: json.data.commissions.escrow,
          });
        }
      })
      .catch(() => {
        // Fallback sur les plans statiques — la page reste fonctionnelle hors ligne
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const transactionPct =
    liveCommissions?.transaction != null ? `${Number(liveCommissions.transaction) * 100}%` : '1%';
  const escrowPct =
    liveCommissions?.escrow != null ? `${Number(liveCommissions.escrow) * 100}%` : '2%';

  const highlights = [
    {
      icon: Smartphone,
      title: 'Mobile Money accepté',
      desc: 'Wave, TMoney, Flooz, Moov Money — vos clients paient depuis leur téléphone sans frais supplémentaires.',
    },
    {
      icon: Shield,
      title: 'Paiement sécurisé Escrow',
      desc: "L'argent est séquestré jusqu'à confirmation de livraison. Pas de risque d'arnaque.",
    },
    {
      icon: Percent,
      title: `${transactionPct} seulement par transaction`,
      desc: "La plateforme prélève une commission sur chaque vente réussie quand vous gagnez de l'argent.",
    },
    {
      icon: Bot,
      title: 'Copilot IA',
      desc: 'Un assistant intelligent qui vous alerte sur WhatsApp pour optimiser vos stocks et ventes.',
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <Header />

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(5,150,105,0.08),_transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium mb-6 border border-amber-200/50 dark:border-amber-800/30">
              <Sparkles className="h-3.5 w-3.5" />
              Gratuit pour tous — pas de carte bancaire requise
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
              100% gratuit,
              <br />
              <span className="bg-gradient-to-r from-brand to-emerald-400 bg-clip-text text-transparent">
                vous payez seulement quand vous vendez
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              AfriBiz est entièrement gratuit à l&apos;inscription. Pas de frais cachés. Nous
              prélevons seulement {transactionPct} sur chaque transaction quand votre business
              génère des revenus.
            </p>
          </motion.div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto mt-12"
          >
            {highlights.map((h, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center hover:border-brand/20 hover:shadow-sm transition-all"
              >
                <div className="mx-auto w-10 h-10 rounded-full bg-brand/5 flex items-center justify-center mb-2">
                  <h.icon className="h-5 w-5 text-brand" />
                </div>
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {h.title}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {h.desc}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-16">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 sm:p-8 flex flex-col ${
                    plan.popular
                      ? 'border-brand shadow-card-hover scale-[1.02] md:scale-105 z-10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } transition-all duration-300`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand to-emerald-400 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-brand/20 whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${plan.gradient} bg-opacity-10`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {plan.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {plan.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`h-5 w-5 shrink-0 mt-0.5 ${
                            plan.popular ? 'text-brand' : 'text-gray-400 dark:text-gray-500'
                          }`}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.footnote && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 italic">
                      {plan.footnote}
                    </p>
                  )}

                  <Link
                    href={plan.href}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 group mt-auto ${
                      plan.popular
                        ? 'bg-gradient-to-r from-brand to-emerald-400 text-white hover:shadow-xl hover:shadow-brand/25'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Dev plan banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-5xl mx-auto mt-8"
          >
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 shadow-lg shadow-blue-600/10">
              <div className="flex items-center gap-4 sm:min-w-0">
                <div className="p-3 rounded-xl bg-white/15 shrink-0">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="sm:min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-bold text-white">{devPlan.name}</h3>
                    <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full">
                      {devPlan.price}
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">{devPlan.description}</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {devPlan.features.slice(0, 4).map((f) => (
                      <li key={f} className="text-blue-50 text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="sm:ml-auto shrink-0">
                <Link
                  href={devPlan.href}
                  className="flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
                >
                  {devPlan.cta}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
            Comment gagnons-nous de l&apos;argent ?
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Contrairement aux autres plateformes qui facturent des abonnements mensuels, nous avons
            choisi un modèle plus juste pour l&apos;Afrique.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                <Percent className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {transactionPct} sur les transactions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Quand un client vous paie via Mobile Money (Wave, TMoney, Flooz) ou carte bancaire,
                nous prélevons {transactionPct} du montant.{' '}
                <strong>Si vous ne vendez pas, vous ne payez rien.</strong>
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {escrowPct} sur l&apos;Escrow
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Notre service de tiers de confiance sécurise vos transactions. L&apos;argent est
                libéré uniquement quand le client confirme la réception.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Copilot IA (Premium)
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Bientôt disponible : un assistant IA qui analyse vos ventes et vous envoie des
                alertes WhatsApp. Option payante, mais <strong>pas obligatoire</strong>.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <motion.div {...fadeInUp} className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 open:border-brand/30 open:shadow-sm transition-all"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-brand transition-colors">
                  {faq.q}
                  <span className="shrink-0 ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 group-open:bg-brand/10 group-open:text-brand transition-colors text-xs">
                    <svg
                      className="w-3 h-3 group-open:rotate-180 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand via-brand-700 to-emerald-800 text-white">
        <motion.div {...fadeInUp} className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Prêt à lancer votre business ?</h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Rejoignez gratuitement des centaines de commerçants africains. Pas de carte bancaire,
            pas d&apos;engagement.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-brand font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-50 transition-all shadow-xl shadow-black/20"
          >
            Créer mon compte gratuit
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-emerald-200 text-sm mt-4">
            0 FCFA à l&apos;inscription · {transactionPct} commission seulement sur les ventes
          </p>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
