'use client';

import { Code, Puzzle, Globe, DollarSign, Users, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';

const benefits = [
  { icon: Puzzle, title: 'Publiez vos modules', desc: 'Créez et publiez des modules SaaS pour les business africains.' },
  { icon: Globe, title: 'Marché panafricain', desc: 'Distribuez vos solutions dans 10+ pays d\'Afrique de l\'Ouest.' },
  { icon: DollarSign, title: 'Revenus récurrents', desc: 'Les développeurs génèrent en moyenne 2 500 000 FCFA/an.' },
  { icon: Code, title: 'API & SDK', desc: 'Accédez à notre API complète et nos SDK pour intégrations rapides.' },
  { icon: Zap, title: 'Déploiement rapide', desc: 'Sandbox de test et déploiement en un clic.' },
  { icon: Users, title: 'Communauté active', desc: 'Échangez avec 200+ développeurs dans notre communauté.' },
];

export default function BecomeDeveloperPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Devenir Développeur"
        description="Publiez vos modules sur la marketplace AfriBiz"
        breadcrumbs={[{ label: 'Devenir Développeur' }]}
      />

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 rounded-xl p-8 md:p-12 text-white mb-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Créez, publiez, monétisez
          </h2>
          <p className="text-indigo-100 mb-6">
            Rejoignez notre écosystème de développeurs et créez des modules SaaS qui
            répondent aux besoins des business africains.
          </p>
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">200+</span>
              <span className="text-indigo-200 text-sm">Développeurs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">2.5M</span>
              <span className="text-indigo-200 text-sm">FCFA/an en moyenne</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">50+</span>
              <span className="text-indigo-200 text-sm">Modules publiés</span>
            </div>
          </div>
          <Link href="/dashboard/developer/onboarding">
            <Button
              size="lg"
              className="bg-white text-indigo-800 hover:bg-indigo-50"
            >
              Commencer l&apos;onboarding Développeur
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Avantages */}
      <h3 className="text-lg font-bold text-gray-900 mb-6">Pourquoi devenir développeur sur AfriBiz ?</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {benefits.map((benefit, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-200">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700 w-fit mb-4">
              <benefit.icon className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">{benefit.title}</h4>
            <p className="text-sm text-gray-500">{benefit.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Prêt à créer votre premier module ?</h3>
        <p className="text-sm text-gray-500 mb-6">Rejoignez l&apos;écosystème AfriBiz et monétisez vos compétences techniques.</p>
        <Link href="/dashboard/developer/onboarding">
          <Button size="lg" variant="primary" className="bg-indigo-700 hover:bg-indigo-800">
            Commencer l&apos;onboarding Développeur
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
