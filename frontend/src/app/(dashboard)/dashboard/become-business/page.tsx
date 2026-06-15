'use client';

import { TrendingUp, Users, Globe, ShoppingBag, BarChart3, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const benefits = [
  { icon: Globe, title: 'Visibilité maximale', desc: 'Touchez des milliers de clients à travers l\'Afrique de l\'Ouest.' },
  { icon: ShoppingBag, title: 'Vendez facilement', desc: 'Gérez vos produits, services et réservations depuis une plateforme unique.' },
  { icon: BarChart3, title: 'Analytics avancés', desc: 'Suivez vos ventes, votre trafic et la performance de votre business.' },
  { icon: Shield, title: 'Paiements sécurisés', desc: 'Acceptez Wave, Flooz, TMoney et plus via notre système escrow.' },
  { icon: Users, title: 'Fidélisation', desc: 'Créez des programmes de fidélité et fidélisez votre clientèle.' },
  { icon: TrendingUp, title: 'Croissance', desc: 'Les business AfriBiz génèrent en moyenne 850 000 FCFA/mois.' },
];

export default function BecomeBusinessPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Devenir Business"
        description="Développez votre activité sur AfriBiz"
        breadcrumbs={[{ label: 'Devenir Business' }]}
      />

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 rounded-xl p-8 md:p-12 text-white mb-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Lancez votre business en ligne
          </h2>
          <p className="text-emerald-100 mb-6">
            Rejoignez les 500+ business qui vendent déjà sur AfriBiz et profitez d&apos;une plateforme
            conçue pour le marché africain.
          </p>
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">500+</span>
              <span className="text-emerald-200 text-sm">Business actifs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">50K+</span>
              <span className="text-emerald-200 text-sm">Clients</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                <span className="line-through text-emerald-300">Gratuit</span>
              </span>
              <span className="text-emerald-200 text-sm">Inscription 100% gratuite</span>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-8 border border-white/20">
            <p className="text-sm font-medium mb-1">💰 Modèle de monétisation transparent</p>
            <p className="text-xs text-emerald-100">
              AffriBiz ne facture <strong>aucun abonnement</strong>. Prélevez seulement <strong>1%</strong> sur les transactions 
              et <strong>2%</strong> sur les escrows. Le reste vous revient intégralement.
            </p>
          </div>
          <Link href="/dashboard/onboarding">
            <Button
              size="lg"
              className="bg-white text-emerald-800 hover:bg-emerald-50"
            >
              Commencer l&apos;onboarding Business
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Avantages */}
      <h3 className="text-lg font-bold text-gray-900 mb-6">Pourquoi devenir business sur AfriBiz ?</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {benefits.map((benefit, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-emerald-200 hover:shadow-md transition-all duration-200">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 w-fit mb-4">
              <benefit.icon className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">{benefit.title}</h4>
            <p className="text-sm text-gray-500">{benefit.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA final */}
      <div className="text-center bg-white rounded-xl border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Prêt à développer votre business ?</h3>
        <p className="text-sm text-gray-500 mb-6">Rejoignez la marketplace AfriBiz et commencez à vendre en quelques minutes.</p>
        <Link href="/dashboard/onboarding">
          <Button size="lg">
            Commencer l&apos;onboarding Business
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
