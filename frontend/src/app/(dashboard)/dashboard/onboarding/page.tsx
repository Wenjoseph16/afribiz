'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Store,
  ShoppingBag,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    title: 'Bienvenue sur AfriBiz',
    desc: 'La plateforme tout-en-un pour développer votre business en Afrique. Gratuit, sans abonnement.',
    icon: Sparkles,
    action: { label: 'Créer mon profil', href: '/dashboard/profile' },
    tips: [
      'Ajoutez votre photo de profil',
      'Renseignez votre numéro de téléphone',
      'Personnalisez vos paramètres',
    ],
  },
  {
    title: 'Créez votre boutique',
    desc: 'Devenez vendeur et créez votre page business pour vendre produits et services.',
    icon: Store,
    action: { label: 'Devenir vendeur', href: '/dashboard/become-business' },
    tips: [
      'Ajoutez vos produits avec photos',
      "Définissez vos horaires d'ouverture",
      'Configurez vos zones de livraison',
    ],
  },
  {
    title: 'Activez les paiements',
    desc: 'Acceptez Mobile Money (Wave, TMoney, Flooz) et cartes bancaires.',
    icon: Smartphone,
    action: { label: 'Configurer les paiements', href: '/dashboard/settings' },
    tips: [
      'Connectez votre compte Wave',
      'Activez TMoney et Flooz',
      'Configurez vos méthodes de retrait',
    ],
  },
  {
    title: 'Publiez vos offres',
    desc: 'Mettez en ligne vos produits, services et promotions pour attirer des clients.',
    icon: ShoppingBag,
    action: { label: 'Ajouter un produit', href: '/dashboard/products/new' },
    tips: ['Ajoutez des photos de qualité', 'Fixez des prix compétitifs', 'Créez des promotions'],
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const toggleStep = (index: number) => {
    if (completed.includes(index)) {
      setCompleted(completed.filter((i) => i !== index));
    } else {
      setCompleted([...completed, index]);
    }
  };

  const progress = Math.round((completed.length / steps.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4 border border-emerald-200">
          <Sparkles className="h-3.5 w-3.5" />
          Lancement guidé AfriBiz
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Lancez votre activité avec confiance
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Un parcours en 4 étapes pour transformer votre présence en croissance réelle
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Progression
          </span>
          <span className="text-sm text-brand font-semibold">{progress}%</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {completed.length}/{steps.length} étapes complétées
        </p>
      </motion.div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = completed.includes(index);
          const isActive = currentStep === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                isCompleted
                  ? 'border-emerald-300 dark:border-emerald-700'
                  : isActive
                    ? 'border-brand shadow-card-hover'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => {
                setCurrentStep(index);
                toggleStep(index);
              }}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-brand/5 text-brand'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-brand">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>

                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-3"
                        >
                          <ul className="space-y-1.5">
                            {step.tips.map((tip, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                          <Link
                            href={step.action.href}
                            className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
                          >
                            {step.action.label}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-emerald-600 via-brand to-slate-900 rounded-2xl p-6 text-white text-center"
      >
        <Sparkles className="h-8 w-8 mx-auto mb-3 text-emerald-200" />
        <h2 className="text-xl font-bold mb-2">Prêt à lancer votre business ?</h2>
        <p className="text-emerald-100/80 text-sm mb-4">
          Explorez la marketplace et commencez à vendre
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 bg-white text-brand px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
        >
          <Play className="h-4 w-4" />
          Découvrir la marketplace
        </Link>
      </motion.div>
    </div>
  );
}
