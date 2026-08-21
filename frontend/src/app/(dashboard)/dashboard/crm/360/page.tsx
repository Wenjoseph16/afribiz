'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Search,
  Loader,
  User,
  ShoppingBag,
  CalendarCheck,
  Eye,
  MousePointerClick,
  FileText,
  Tag,
  Network,
  PiggyBank,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/utils/helpers';

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export default function Customer360Page() {
  const { user } = useAuthStore();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['crm-clients-360'],
    queryFn: async () => {
      const res = await apiClient.getBusinessClients({ limit: 200 });
      return res.data.data;
    },
    enabled: !!user,
  });

  const clients = Array.isArray(clientsData)
    ? clientsData
    : clientsData?.items || clientsData?.data || [];

  const filteredClients = search
    ? clients.filter(
        (c: any) =>
          (c.firstName || c.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.phone || '').includes(search)
      )
    : clients;

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['crm-360', selectedClientId],
    queryFn: async () => {
      const res = await apiClient.getCustomer360(selectedClientId as string);
      return res.data.data;
    },
    enabled: !!selectedClientId,
  });

  const profile = profileData?.data || profileData || null;

  const renderSection = (title: string, icon: React.ReactNode, children: React.ReactNode) => (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h3>
      {children}
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/crm"
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </Link>
        <PageHeader
          title="Customer 360"
          description="Vue complète de chaque client : achats, réservations, navigation, interactions"
          breadcrumbs={[{ label: 'CRM', href: '/dashboard/crm' }, { label: 'Customer 360' }]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Client list */}
        <div className="lg:col-span-1">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Users className="h-4 w-4 text-brand" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Clients ({clients.length})
              </span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
              />
            </div>
            {clientsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : filteredClients.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">
                Aucun client. Les clients apparaîtront après leurs premiers achats.
              </p>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto space-y-1 pr-1">
                {filteredClients.map((c: any) => {
                  const name = c.firstName || c.name || 'Client';
                  const isActive = selectedClientId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClientId(c.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                        isActive
                          ? 'bg-brand/10 dark:bg-brand-900/20 border border-brand/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {c.phone || c.email || '—'}
                        </p>
                      </div>
                      {c.totalSpent !== undefined && (
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {formatPrice(Number(c.totalSpent || 0))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* 360 detail */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedClientId ? (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
              <Network className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Sélectionnez un client
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Choisissez un client dans la liste pour voir son historique complet : commandes,
                réservations, navigation, notes, tags, segments et plus.
              </p>
            </Card>
          ) : profileLoading ? (
            <Card className="flex items-center justify-center py-20">
              <Loader className="h-8 w-8 animate-spin text-brand" />
            </Card>
          ) : !profile ? (
            <Card className="text-center py-12">
              <p className="text-sm text-gray-500">Impossible de charger le profil client.</p>
            </Card>
          ) : (
            <>
              {/* Header */}
              <Card className="p-5 bg-gradient-to-br from-brand to-brand-700 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                    <User className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">
                      {profile.client?.fullName ||
                        profile.client?.firstName ||
                        profile.fullName ||
                        'Client'}
                    </h2>
                    <p className="text-sm text-white/80 truncate">
                      {profile.client?.phone || profile.phone || '—'}
                      {profile.client?.email || profile.email
                        ? ` · ${profile.client?.email || profile.email}`
                        : ''}
                      {profile.client?.city ? ` · ${profile.client.city}` : ''}
                    </p>
                  </div>
                  {profile.clientRisk?.riskLevel && (
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        RISK_COLORS[profile.clientRisk.riskLevel as string] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Risque {profile.clientRisk.riskLevel}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-white/70">Total dépensé</p>
                    <p className="text-lg font-bold">
                      {formatPrice(Number(profile.totalSpent || 0))}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-white/70">Commandes</p>
                    <p className="text-lg font-bold">{(profile.orders || []).length}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-white/70">Réservations</p>
                    <p className="text-lg font-bold">{(profile.bookings || []).length}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-white/70">Points fidélité</p>
                    <p className="text-lg font-bold">{profile.loyalty?.totalPoints ?? 0}</p>
                  </div>
                </div>
              </Card>

              {/* Orders */}
              {renderSection(
                'Commandes',
                <ShoppingBag className="h-4 w-4 text-brand" />,
                (profile.orders || []).length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune commande.</p>
                ) : (
                  <div className="space-y-2">
                    {(profile.orders || []).map((o: any) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {o.orderNumber || `#${String(o.id).slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'}{' '}
                            · {o.status}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatPrice(Number(o.totalAmount || 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Bookings */}
              {renderSection(
                'Réservations',
                <CalendarCheck className="h-4 w-4 text-brand" />,
                (profile.bookings || []).length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune réservation.</p>
                ) : (
                  <div className="space-y-2">
                    {(profile.bookings || []).map((b: any) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {b.title || b.serviceName || 'Réservation'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {b.startDate ? new Date(b.startDate).toLocaleDateString('fr-FR') : '—'}{' '}
                            · {b.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Épargne Achat — plans du client chez ce business */}
              {renderSection(
                'Épargne Achat',
                <PiggyBank className="h-4 w-4 text-brand" />,
                !profile.savings || (profile.savings.plans || []).length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aucun plan épargne. Le client peut épargner sur vos produits, services, chambres
                    et événements — argent sécurisé en escrow.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          Épargné en escrow
                        </p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {formatPrice(profile.savings.totalSaved || 0)}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                        <p className="text-[10px] text-gray-500">En cours</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {profile.savings.activePlans || 0}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">Prêts</p>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                          {profile.savings.readyPlans || 0}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400">Terminés</p>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                          {profile.savings.completedPlans || 0}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {(profile.savings.plans || []).map((sp: any) => (
                        <div
                          key={sp.id}
                          className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {sp.itemName}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 shrink-0">
                              {formatPrice(sp.savedAmount)} / {formatPrice(sp.targetAmount)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${sp.progress || 0}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-400">
                            <span>
                              {sp.progress}% ·{' '}
                              {sp.status === 'ACTIVE'
                                ? 'En cours'
                                : sp.status === 'READY'
                                  ? 'Prêt à convertir'
                                  : sp.status === 'COMPLETED'
                                    ? 'Terminé'
                                    : sp.status}
                            </span>
                            {sp.expiresAt && (
                              <span>
                                Échéance {new Date(sp.expiresAt).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Recent activity / page views */}
              {renderSection(
                'Navigation récente',
                <Eye className="h-4 w-4 text-brand" />,
                (profile.activityTimeline || profile.pageViews || []).length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune activité récente.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(profile.activityTimeline || profile.pageViews || []).map(
                      (v: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                        >
                          <MousePointerClick className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {v.description ||
                              v.activityType ||
                              v.type ||
                              (v.referrer ? `Visite depuis ${v.referrer}` : 'Visite')}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto shrink-0">
                            {v.createdAt || v.viewedAt
                              ? new Date(v.createdAt || v.viewedAt).toLocaleDateString('fr-FR')
                              : ''}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )
              )}

              {/* Notes + tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderSection(
                  'Notes internes',
                  <FileText className="h-4 w-4 text-brand" />,
                  (profile.notes || []).length === 0 ? (
                    <p className="text-sm text-gray-500">Aucune note.</p>
                  ) : (
                    <div className="space-y-2">
                      {(profile.notes || []).map((n: any) => (
                        <div key={n.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                          <p className="text-sm text-gray-700 dark:text-gray-200">{n.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR') : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                )}
                {renderSection(
                  'Tags & Segments',
                  <Tag className="h-4 w-4 text-brand" />,
                  <div className="space-y-2">
                    {(profile.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(profile.tags || []).map((t: any) => (
                          <span
                            key={t.id}
                            className="text-xs px-2 py-1 rounded-lg bg-brand/10 text-brand"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {(profile.segments || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(profile.segments || []).map((s: any) => (
                          <span
                            key={s.id}
                            className="text-xs px-2 py-1 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {(profile.tags || []).length === 0 && (profile.segments || []).length === 0 && (
                      <p className="text-sm text-gray-500">Aucun tag ou segment.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
