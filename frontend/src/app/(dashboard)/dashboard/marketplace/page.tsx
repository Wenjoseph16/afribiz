'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Puzzle, ShoppingBag, Calendar,
  Car, Megaphone, Package, Hand, Bed, Users, Palette,
  Truck, CreditCard, FileText, MessageCircle, Zap,
  Search, Check, X, Loader2, Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useBusinessStore } from '@/stores/businessStore';
import type { BusinessModule } from '@/types/business';
import { cn } from '@/lib/utils';

const MODULES = [
  { id: 'PRODUCTS', name: 'Produits', desc: 'Gérez votre catalogue de produits avec stock, prix, variantes et catégories.', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', popular: true },
  { id: 'SERVICES', name: 'Services', desc: 'Proposez et gérez vos services avec durée, tarifs et disponibilité.', icon: Hand, color: 'text-purple-600', bg: 'bg-purple-50', popular: true },
  { id: 'MENU', name: 'Menu / Carte', desc: 'Créez un menu digital avec catégories, plats, prix et photos.', icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'BOOKINGS', name: 'Réservations', desc: 'Gérez les réservations de tables, rendez-vous ou créneaux.', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', popular: true },
  { id: 'ROOMS', name: 'Chambres / Hébergement', desc: 'Gérez vos chambres, taux d\'occupation et tarifs.', icon: Bed, color: 'text-teal-600', bg: 'bg-teal-50' },
  { id: 'ORDERS', name: 'Commandes', desc: 'Suivez et gérez les commandes de vos clients en temps réel.', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50', popular: true },
  { id: 'EVENTS', name: 'Événements', desc: 'Créez et gérez des événements avec inscriptions et billeterie.', icon: Megaphone, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'RENTALS', name: 'Locations', desc: 'Gérez la location de véhicules, matériel ou espaces.', icon: Car, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'PROMOTIONS', name: 'Promotions', desc: 'Créez des offres spéciales, réductions et codes promo.', icon: Zap, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'PORTFOLIO', name: 'Portfolio', desc: 'Exposez vos réalisations et travaux (photographe, artisan, etc.).', icon: Palette, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'DELIVERIES', name: 'Livraisons', desc: 'Configurez vos zones et tarifs de livraison.', icon: Truck, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'EMPLOYEES', name: 'Employés', desc: 'Gérez vos employés, horaires et permissions.', icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'PLANNING', name: 'Planning', desc: 'Planifiez les tâches et rendez-vous de votre équipe.', icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-50' },
  { id: 'QUOTES_INVOICES', name: 'Devis & Factures', desc: 'Générez des devis et factures professionnels.', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'DEBTS_PAYMENTS', name: 'Dettes & Paiements', desc: 'Suivez les dettes clients et les paiements en attente.', icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'SUBSCRIPTIONS', name: 'Abonnements', desc: 'Gérez les abonnements et paiements récurrents.', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'DOCUMENTS', name: 'Documents', desc: 'Stockez et partagez vos documents importants.', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
  { id: 'PARTNERS', name: 'Partenaires', desc: 'Gérez vos partenariats et affiliations.', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'DISPUTES', name: 'Litiges', desc: 'Gérez les réclamations et litiges clients.', icon: MessageCircle, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'ADVANCED_TASKS', name: 'Tâches avancées', desc: 'Automatisations et workflows personnalisés.', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export default function MarketplacePage() {
  const queryClient = useQueryClient();
  const { business } = useBusinessStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'installed' | 'available'>('all');

  const activeModules = business?.modules || [];

  const toggleModule = useMutation({
    mutationFn: ({ module, enabled }: { module: string; enabled: boolean }) => apiClient.toggleBusinessModule(module, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBusiness'] });
    },
  });

  const filteredModules = MODULES.filter((mod) => {
    const matchesSearch = !search || mod.name.toLowerCase().includes(search.toLowerCase()) || mod.desc.toLowerCase().includes(search.toLowerCase());
    const isInstalled = activeModules.includes(mod.id as BusinessModule);
    if (filter === 'installed') return matchesSearch && isInstalled;
    if (filter === 'available') return matchesSearch && !isInstalled;
    return matchesSearch;
  });

  const categories = [
    { label: 'Tous', value: 'all' as const },
    { label: 'Installés', value: 'installed' as const },
    { label: 'Disponibles', value: 'available' as const },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Marketplace de modules"
        description="Découvrez et activez les modules adaptés à votre activité"
        gradient
      />

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                filter === cat.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((mod) => {
    const isInstalled = activeModules.includes(mod.id as BusinessModule);
    const Icon = mod.icon;
    return (
              <Card key={mod.id} hoverable className="flex flex-col">
              <div className="flex items-start gap-4 mb-3">
                <div className={cn('p-3 rounded-xl shrink-0', mod.bg, mod.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{mod.name}</h3>
                    {mod.popular && (
                      <span className="text-[10px] font-medium text-brand bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded-full shrink-0">
                        Populaire
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mod.desc}</p>
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                {isInstalled ? (
                  <div className="flex gap-2">                <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleModule.mutate({ module: mod.id, enabled: false })}
                      disabled={toggleModule.isPending}
                    >
                      {toggleModule.isPending && toggleModule.variables?.module === mod.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      Installé
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleModule.mutate({ module: mod.id, enabled: false })}
                      disabled={toggleModule.isPending}
                      className="text-red-500 hover:text-red-600"
                    >
                      {toggleModule.isPending && toggleModule.variables?.module === mod.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => toggleModule.mutate({ module: mod.id, enabled: true })}
                    disabled={toggleModule.isPending}
                  >
                    {toggleModule.isPending && toggleModule.variables?.module === mod.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Activer
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <EmptyState
          icon={<Puzzle className="h-12 w-12" />}
          title="Aucun module trouvé"
          description="Essayez de modifier vos filtres ou votre recherche."
        />
      )}
    </div>
  );
}
