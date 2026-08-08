'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PiggyBank,
  Lock,
  Plus,
  Trash2,
  Users,
  Target,
  Percent,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

const planStatusLabel: Record<string, { label: string; variant: 'info' | 'success' | 'warning' | 'default' }> = {
  ACTIVE: { label: 'En épargne', variant: 'info' },
  READY: { label: 'Prêt à valider', variant: 'success' },
  COMPLETED: { label: 'Vendu', variant: 'success' },
  CANCELLED: { label: 'Annulé', variant: 'default' },
};

export default function BusinessLayawayPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [itemType, setItemType] = useState('PRODUCT');
  const [itemId, setItemId] = useState('');
  const [durationDays, setDurationDays] = useState(90);
  const [minInstallment, setMinInstallment] = useState(5000);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['layaway-stats'],
    queryFn: async () => {
      try {
        const res = await apiClient.getBusinessLayawayStats();
        return res.data.data || {};
      } catch {
        return {};
      }
    },
  });
  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['layaway-offers'],
    queryFn: async () => {
      try {
        const res = await apiClient.getLayawayOffers();
        return res.data.data?.offers || [];
      } catch {
        return [];
      }
    },
  });
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['layaway-business-plans'],
    queryFn: async () => {
      try {
        const res = await apiClient.getBusinessLayawayPlans();
        return res.data.data?.plans || [];
      } catch {
        return [];
      }
    },
  });
  const { data: productsData } = useQuery({
    queryKey: ['layaway-products'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyProducts();
        const items = res.data.data?.products || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((p: any) => ({
          value: p.id,
          label: `${p.name} — ${formatPrice(p.price, p.currency)}`,
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: servicesData } = useQuery({
    queryKey: ['layaway-services'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyServices();
        const items = res.data.data?.services || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((s: any) => ({
          value: s.id,
          label: `${s.name} — ${formatPrice(s.price, s.currency)}`,
        }));
      } catch {
        return [];
      }
    },
  });

  const toggleOffer = useMutation({
    mutationFn: (o: any) => apiClient.toggleLayawayOffer(o.id, !o.isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['layaway-offers'] }),
  });
  const deleteOffer = useMutation({
    mutationFn: (id: string) => apiClient.deleteLayawayOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['layaway-offers'] }),
  });

  const createOffer = async () => {
    if (!itemId) {
      setError("Choisissez un article");
      return;
    }
    setCreating(true);
    setError('');
    try {
      await apiClient.createLayawayOffer({ itemType, itemId, durationDays, minInstallment });
      setShowCreate(false);
      setItemId('');
      qc.invalidateQueries({ queryKey: ['layaway-offers'] });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors de l'activation");
    } finally {
      setCreating(false);
    }
  };

  const offers = Array.isArray(offersData) ? offersData : [];
  const plans = Array.isArray(plansData) ? plansData : [];
  const activePlans = plans.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');
  const itemOptions = itemType === 'PRODUCT' ? productsData : servicesData;

  if (statsLoading || offersLoading || plansLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Épargne Achat"
        description="Laissez vos clients épargner pour vos produits — ventes garanties, argent sécurisé en escrow"
        breadcrumbs={[{ label: 'Épargne Achat' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Activer l'épargne
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard icon={<PiggyBank className="h-5 w-5" />} label="Plans en cours" value={stats?.activePlans ?? 0} />
        <StatsCard icon={<Lock className="h-5 w-5" />} label="Séquestré (escrow)" value={formatPrice(stats?.totalEscrowed ?? 0)} />
        <StatsCard icon={<Target className="h-5 w-5" />} label="Prêts à valider" value={stats?.readyPlans ?? 0} />
        <StatsCard icon={<Percent className="h-5 w-5" />} label="Commission à la vente" value="1%" />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-900/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          <strong>Gagnez des ventes sans crédit :</strong> vos clients épargnent via AfriBiz. L&apos;argent est bloqué en
          escrow et vous est libéré (moins 1% de commission) uniquement quand le client valide son achat. S&apos;il
          annule, il est remboursé — vous ne perdez rien.
        </p>
      </div>

      <Card title="Articles éligibles" titleIcon={<Sparkles className="h-4 w-4" />}>
        {offers.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="h-10 w-10" />}
            title="Aucune offre épargne"
            description="Activez l'épargne sur un produit ou service pour permettre à vos clients d'acheter en épargnant."
            action={
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Activer l'épargne
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {offers.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium">{o.item?.name || o.itemId}</p>
                  <p className="text-xs text-gray-500">
                    {o.itemType === 'PRODUCT' ? 'Produit' : 'Service'} · {formatPrice(o.item?.price)} ·{' '}
                    {o.durationDays} jours · min {formatPrice(o.minInstallment)} · {o.planCount} plan(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={o.isActive ? 'success' : 'default'}>{o.isActive ? 'Active' : 'Désactivée'}</Badge>
                  <button
                    onClick={() => toggleOffer.mutate(o)}
                    className="text-gray-400 hover:text-brand transition-colors"
                    title={o.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {o.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => deleteOffer.mutate(o.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Plans de vos clients" titleIcon={<Users className="h-4 w-4" />}>
        {activePlans.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aucun plan épargne actif. Partagez vos produits avec le badge 🔒 Épargne pour attirer des clients.
          </p>
        ) : (
          <div className="space-y-2">
            {activePlans.map((p: any) => {
              const st = planStatusLabel[p.status] || { label: p.status, variant: 'default' };
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <p className="text-sm font-medium">{p.itemName}</p>
                    <p className="text-xs text-gray-500">
                      Client #{String(p.clientId).slice(0, 8)} · {formatPrice(p.savedAmount)} / {formatPrice(p.targetAmount)} ·{' '}
                      {p.contributions?.length || 0} cotisation(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.progress >= 100 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{p.progress}%</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Activer l'épargne sur un article">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Type d'article</label>
            <Select
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value);
                setItemId('');
              }}
              options={[
                { value: 'PRODUCT', label: 'Produit' },
                { value: 'SERVICE', label: 'Service' },
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Article</label>
            <Select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              options={[{ value: '', label: 'Choisir...' }, ...(itemOptions || [])]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Durée max (jours)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Cotisation min (FCFA)</label>
              <input
                type="number"
                value={minInstallment}
                onChange={(e) => setMinInstallment(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{error}</p>}
          <Button variant="primary" className="w-full" onClick={createOffer} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
            {creating ? 'Activation...' : "Activer l'épargne sécurisée"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
