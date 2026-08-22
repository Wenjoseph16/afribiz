'use client';

import { motion } from 'framer-motion';
import { Store, Eye, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PERKS = [
  {
    icon: Store,
    title: 'Votre vitrine en ligne',
    desc: 'Une page professionnelle avec votre marque, vos horaires et vos contacts.',
  },
  {
    icon: Eye,
    title: 'Aperçu en temps réel',
    desc: 'Visualisez votre page publique se construire à chaque étape.',
  },
  {
    icon: Rocket,
    title: 'Prêt en 3 minutes',
    desc: '5 étapes simples. Modifiable à tout moment depuis le dashboard.',
  },
];

export default function StepWelcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-lg w-full text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-600/25 flex items-center justify-center mx-auto">
          <Store className="h-8 w-8 text-white" />
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Créez votre business
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          Rejoignez les milliers d&apos;entrepreneurs qui vendent déjà sur AfriBiz. Votre vitrine
          sera visible par tous les clients de la plateforme dès la fin du formulaire.
        </p>

        <div className="mt-10 grid gap-4 text-left">
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.35 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            >
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 shrink-0">
                <perk.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {perk.title}
                </p>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{perk.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <Button onClick={onStart} className="mt-8 w-full sm:w-auto px-8 py-3 text-base">
          Commencer
          <Rocket className="h-4 w-4" />
        </Button>
        <p className="text-xs text-gray-400 mt-3">Gratuit · Sans engagement</p>
      </motion.div>
    </div>
  );
}
