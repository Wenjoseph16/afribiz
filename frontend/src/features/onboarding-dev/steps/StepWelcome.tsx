'use client';

import {
  Rocket,
  Code2,
  Star,
  ShieldCheck,
  Globe,
  ArrowRight,
  BadgeCheck,
  FolderOpen,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const BENEFITS = [
  {
    icon: Code2,
    title: 'Publiez vos modules',
    desc: 'Créez et distribuez vos solutions sur la marketplace AfriBiz',
  },
  {
    icon: Star,
    title: "Gagnez de l'argent",
    desc: 'Monétisez vos créations via ventes et abonnements récurrents',
  },
  {
    icon: ShieldCheck,
    title: 'Badge vérifié',
    desc: 'Votre identité contrôlée inspire confiance aux entreprises',
  },
  {
    icon: Globe,
    title: 'Visibilité panafricaine',
    desc: "Touchez des milliers d'entreprises sur tout le continent",
  },
];

const TRUST_SIGNALS = [
  { icon: BadgeCheck, label: 'Photo & logo pro' },
  { icon: Code2, label: 'Stack maîtrisée' },
  { icon: FolderOpen, label: 'Projets réalisés' },
  { icon: Award, label: 'Certifications' },
];

export default function StepWelcome({
  onStart,
  isLoading,
}: {
  onStart: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="text-center py-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand/20 animate-float">
        <Rocket className="h-10 w-10 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Construisez votre profil de développeur de confiance
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
        Comme sur les grandes plateformes freelance, votre crédibilité repose sur des preuves
        concrètes. Nous allons les rassembler en 5 minutes.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6 text-left">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
          >
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand shrink-0">
              <b.icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium">Ce qui construit votre confiance :</span>
        {TRUST_SIGNALS.map((t) => (
          <span
            key={t.label}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium"
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </span>
        ))}
      </div>

      <Button variant="gradient" size="lg" onClick={onStart} isLoading={isLoading}>
        Commencer l&apos;aventure
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
