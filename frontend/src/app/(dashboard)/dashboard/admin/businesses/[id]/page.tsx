'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Building2, Shield, Package, Server, ShoppingCart, Star, ChevronLeft,
  FileText, CreditCard, Scale, Activity, BarChart3, TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type BusinessTab = 'overview' | 'products' | 'scores' | 'documents' | 'payments' | 'disputes';

const VERIF_STYLES: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIF: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDU: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BLOQUÉ: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function useAdminBusinessDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'businesses', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/businesses/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export default function AdminBusinessDetailPage() {
  const { user } = useAuthStore();
  const params = useParams();
  const id = params?.id as string;
  const isAdmin = user?.roles?.includes('ADMIN');

  const [activeTab, setActiveTab] = useState<BusinessTab>('overview');

  const { data: business, isLoading } = useAdminBusinessDetail(id);

  const tabs = [
    { id: 'overview' as BusinessTab, label: 'Aperçu', icon: Building2 },
    { id: 'products' as BusinessTab, label: 'Produits/Services', icon: Package },
    { id: 'scores' as BusinessTab, label: 'Scores', icon: BarChart3 },
    { id: 'documents' as BusinessTab, label: 'Documents', icon: FileText },
    { id: 'payments' as BusinessTab, label: 'Paiements', icon: CreditCard },
    { id: 'disputes' as BusinessTab, label: 'Litiges', icon: Scale },
  ];

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  if (isLoading) {
    return <Loader className="py-20" size="xl" />;
  }

  if (!business) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="Business introuvable"
        description="Ce business n'existe pas ou a été supprimé."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
        <ChevronLeft className="h-4 w-4" />
        Retour
      </Button>

      {/* Profile Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-3xl font-bold text-brand shrink-0">
            {business.name?.[0]?.toUpperCase() || 'B'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {business.name || 'N/A'}
              </h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                STATUS_STYLES[business.status] || 'bg-gray-100 text-gray-600'
              }`}>{business.status}</span>
              {business.verificationStatus && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  VERIF_STYLES[business.verificationStatus] || 'bg-gray-100 text-gray-600'
                }`}>{business.verificationStatus}</span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand text-sm font-bold">
                <BarChart3 className="h-3.5 w-3.5" />
                Score: {business.afriScore ?? '-'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {business.type} {business.sector ? `· ${business.sector}` : ''} {business.country ? `· ${business.country}` : ''}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">{business.email}</p>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Produits', value: business.productsCount ?? 0, icon: Package, color: 'text-blue-500' },
          { label: 'Services', value: business.servicesCount ?? 0, icon: Server, color: 'text-purple-500' },
          { label: 'Commandes', value: business.ordersCount ?? 0, icon: ShoppingCart, color: 'text-emerald-500' },
          { label: 'Avis', value: business.reviewsCount ?? 0, icon: Star, color: 'text-amber-500' },
          { label: 'Score', value: business.afriScore ?? '-', icon: TrendingUp, color: 'text-brand' },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Informations clés
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Nom', value: business.name },
                { label: 'Type', value: business.type },
                { label: 'Email', value: business.email },
                { label: 'Téléphone', value: business.phone },
                { label: 'Pays', value: business.country },
                { label: 'Ville', value: business.city },
                { label: 'Secteur', value: business.sector },
                { label: 'Site web', value: business.website },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.value || '-'}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Activité récente
            </h3>
            {business.recentActivity?.length > 0 ? (
              <div className="space-y-3">
                {business.recentActivity.map((act: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <Activity className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-gray-900 dark:text-gray-100">{act.description}</p>
                      <p className="text-xs text-gray-400">{act.date ? new Date(act.date).toLocaleString('fr-FR') : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucune activité récente</p>
            )}
          </Card>
        </div>
      )}

      {/* Products/Services Tab */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Produits ({business.productsCount ?? 0})
            </h3>
            {business.products?.length > 0 ? (
              <div className="space-y-2">
                {business.products.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.price ? `${Number(p.price).toLocaleString()} FCFA` : '-'}</p>
                    </div>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{p.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun produit</p>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Services ({business.servicesCount ?? 0})
            </h3>
            {business.services?.length > 0 ? (
              <div className="space-y-2">
                {business.services.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.price ? `${Number(s.price).toLocaleString()} FCFA` : '-'}</p>
                    </div>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{s.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun service</p>
            )}
          </Card>
        </div>
      )}

      {/* Scores Tab */}
      {activeTab === 'scores' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Score actuel
            </h3>
            <div className="text-center py-8">
              <p className="text-5xl font-bold text-brand">{business.afriScore ?? '-'}</p>
              <p className="text-sm text-gray-500 mt-2">AfriScore global</p>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Composants du score
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Présence en ligne', value: business.scoreComponents?.onlinePresence },
                { label: 'Engagement client', value: business.scoreComponents?.clientEngagement },
                { label: 'Qualité des produits', value: business.scoreComponents?.productQuality },
                { label: 'Fiabilité', value: business.scoreComponents?.reliability },
                { label: 'Innovation', value: business.scoreComponents?.innovation },
              ].map((comp) => (
                <div key={comp.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{comp.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.min(100, (comp.value ?? 0) * 20)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8 text-right">
                      {comp.value ?? '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Historique des scores
            </h3>
            {business.scoreHistory?.length > 0 ? (
              <div className="space-y-2">
                {business.scoreHistory.map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-500">
                      {h.date ? new Date(h.date).toLocaleDateString('fr-FR') : '-'}
                    </span>
                    <span className="text-sm font-bold text-brand">{h.score ?? '-'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun historique disponible</p>
            )}
          </Card>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Documents
          </h3>
          {business.documents?.length > 0 ? (
            <div className="space-y-2">
              {business.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.name || doc.type}</p>
                      <p className="text-xs text-gray-400">{doc.status}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    doc.status === 'PENDING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>{doc.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun document</p>
          )}
        </Card>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Paiements
          </h3>
          {business.payments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Montant</th>
                    <th className="pb-2 font-medium">Méthode</th>
                    <th className="pb-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {business.payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <td className="py-2.5 text-gray-900 dark:text-gray-100">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="py-2.5 font-medium">{p.amount ? `${Number(p.amount).toLocaleString()} FCFA` : '-'}</td>
                      <td className="py-2.5 text-gray-500">{p.method || '-'}</td>
                      <td className="py-2.5">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                          p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                          p.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun paiement</p>
          )}
        </Card>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Litiges
          </h3>
          {business.disputes?.length > 0 ? (
            <div className="space-y-2">
              {business.disputes.map((d: any) => (
                <div key={d.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{d.subject || 'Litige'}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      d.status === 'OPEN' ? 'bg-red-50 text-red-700' :
                      d.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{d.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{d.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun litige</p>
          )}
        </Card>
      )}
    </div>
  );
}
