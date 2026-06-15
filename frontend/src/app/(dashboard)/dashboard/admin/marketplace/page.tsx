'use client';

import { useState } from 'react';
import {
  ShoppingBag, Building2, Package, Server, Calendar, MapPin, Code2,
  Shield, Star, Eye, X, ChevronLeft, ChevronRight, Sparkles, Trash2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type MarketplaceTab = 'featured' | 'products' | 'services' | 'events' | 'rentals' | 'modules';

function useAdminMarketplaceItems(type: string, params?: any) {
  return useQuery({
    queryKey: ['admin', 'marketplace', type, params],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/marketplace/${type}`, { params });
      return res.data.data;
    },
  });
}

function useAdminMarketplaceAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, type }: { id: string; action: string; type: string }) =>
      apiClient.put(`/admin/marketplace/${type}/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'marketplace'] });
    },
  });
}

export default function AdminMarketplacePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [activeTab, setActiveTab] = useState<MarketplaceTab>('featured');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const limit = 20;

  const params: any = { page, limit };
  const tabToApi: Record<string, string> = {
    featured: 'featured',
    products: 'products',
    services: 'services',
    events: 'events',
    rentals: 'rentals',
    modules: 'modules',
  };

  const { data: itemsData, isLoading } = useAdminMarketplaceItems(tabToApi[activeTab], params);
  const actionMutation = useAdminMarketplaceAction();

  const items = Array.isArray(itemsData) ? itemsData : itemsData?.items ?? [];
  const totalPages = itemsData?.totalPages ?? 1;

  const handleAction = async (id: string, action: string, itemName: string) => {
    const actionLabels: Record<string, string> = {
      feature: 'mettre en avant',
      unfeature: 'retirer des avant-première',
    };
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir ${actionLabels[action] || action} « ${itemName} » ?`
    );
    if (!confirmed) return;

    try {
      await actionMutation.mutateAsync({ id, action, type: tabToApi[activeTab] });
      setToast({ message: `Élément ${actionLabels[action] || action} avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de l'action « ${actionLabels[action] || action} »`, type: 'error' });
    }
  };

  const tabs = [
    { id: 'featured' as MarketplaceTab, label: 'Business en vedette', icon: Building2 },
    { id: 'products' as MarketplaceTab, label: 'Produits', icon: Package },
    { id: 'services' as MarketplaceTab, label: 'Services', icon: Server },
    { id: 'events' as MarketplaceTab, label: 'Événements', icon: Calendar },
    { id: 'rentals' as MarketplaceTab, label: 'Locations', icon: MapPin },
    { id: 'modules' as MarketplaceTab, label: 'Modules', icon: Code2 },
  ];

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion du marketplace
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Gestion du marketplace
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les contenus mis en avant et les éléments du marketplace
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Nom</th>
                  {activeTab !== 'modules' && <th className="p-4 font-medium">Business</th>}
                  {activeTab === 'modules' && <th className="p-4 font-medium">Développeur</th>}
                  <th className="p-4 font-medium">Prix</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">En vedette</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                          {item.name?.[0]?.toUpperCase() || 'I'}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">
                      {item.business?.name || item.developer?.name || item.businessId || item.developerId || '-'}
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                      {item.price ? `${Number(item.price).toLocaleString()} FCFA` : item.amount ? `${Number(item.amount).toLocaleString()} FCFA` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        item.status === 'ACTIVE' || item.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : item.status === 'PENDING' || item.status === 'PENDING_REVIEW'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>{item.status}</span>
                    </td>
                    <td className="p-4">
                      {item.featured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          En vedette
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Non</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="xs">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {item.featured ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(item.id, 'unfeature', item.name)}
                            isLoading={actionMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            Retirer
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(item.id, 'feature', item.name)}
                            isLoading={actionMutation.isPending}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            Mettre en avant
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Aucun élément"
            description="Aucun élément trouvé dans cette catégorie."
          />
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
