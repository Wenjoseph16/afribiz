'use client';

import { useState, useMemo } from 'react';
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
  Layers,
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
import { ScopePicker, type ScopeValue } from '@/components/formkit/ScopePicker';

const planStatusLabel: Record<
  string,
  { label: string; variant: 'info' | 'success' | 'warning' | 'default' }
> = {
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
  const [showBatch, setShowBatch] = useState(false);
  const [batchItemType, setBatchItemType] = useState('PRODUCT');
  const [batchScope, setBatchScope] = useState<ScopeValue>({
    scope: 'ALL',
    categoryIds: [],
    itemIds: [],
  });
  const [batchDuration, setBatchDuration] = useState(90);
  const [batchMinInstallment, setBatchMinInstallment] = useState(5000);
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [batchResult, setBatchResult] = useState('');

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
  const { data: roomsData } = useQuery({
    queryKey: ['layaway-rooms'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyRooms();
        const items = res.data.data?.rooms || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((r: any) => ({
          value: r.id,
          label: `${r.name} — ${formatPrice(r.price, r.currency)}`,
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: rentalsData } = useQuery({
    queryKey: ['layaway-rentals'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyRentals();
        const items = res.data.data?.rentals || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((r: any) => ({
          value: r.id,
          label: `${r.name} — ${formatPrice(r.price, r.currency)}`,
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: eventsData } = useQuery({
    queryKey: ['layaway-events'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyEvents();
        const items = res.data.data?.events || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((e: any) => ({
          value: e.id,
          label: `${e.title}${e.price ? ' — ' + formatPrice(e.price) : ''}`,
        }));
      } catch {
        return [];
      }
    },
  });
  // Données brutes pour l'activation en masse (ScopePicker)
  const { data: batchProducts } = useQuery({
    queryKey: ['layaway-batch-products'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyProducts({ limit: 500 });
        const items = res.data.data?.products || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price || 0),
          type: 'Produit',
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: batchServices } = useQuery({
    queryKey: ['layaway-batch-services'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyServices({ limit: 500 });
        const items = res.data.data?.services || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((s: any) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price || 0),
          type: 'Service',
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: batchRooms } = useQuery({
    queryKey: ['layaway-batch-rooms'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyRooms();
        const items = res.data.data?.rooms || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((r: any) => ({
          id: r.id,
          name: r.name,
          price: Number(r.price || 0),
          type: 'Chambre',
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: batchRentals } = useQuery({
    queryKey: ['layaway-batch-rentals'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyRentals();
        const items = res.data.data?.rentals || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((r: any) => ({
          id: r.id,
          name: r.name,
          price: Number(r.price || 0),
          type: 'Location',
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: batchEvents } = useQuery({
    queryKey: ['layaway-batch-events'],
    queryFn: async () => {
      try {
        const res = await apiClient.getMyEvents();
        const items = res.data.data?.events || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((e: any) => ({
          id: e.id,
          name: e.title,
          price: Number(e.price || 0),
          type: 'Événement',
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: batchTrainings } = useQuery({
    queryKey: ['layaway-batch-trainings'],
    queryFn: async () => {
      try {
        const res = await apiClient.getBizTrainings();
        const items = res.data.data?.trainings || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((t: any) => ({
          id: t.id,
          name: t.title,
          price: Number(t.price || 0),
          type: 'Formation',
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: batchProductCats } = useQuery({
    queryKey: ['layaway-batch-product-cats'],
    queryFn: async () => {
      try {
        const res = await apiClient.getProductCategories();
        const cats = res.data.data?.categories || res.data.data?.items || res.data.data || [];
        return (Array.isArray(cats) ? cats : []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: batchServiceCats } = useQuery({
    queryKey: ['layaway-batch-service-cats'],
    queryFn: async () => {
      try {
        const res = await apiClient.getServiceCategories();
        const cats = res.data.data?.categories || res.data.data?.items || res.data.data || [];
        return (Array.isArray(cats) ? cats : []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
      } catch {
        return [];
      }
    },
  });
  const { data: trainingsData } = useQuery({
    queryKey: ['layaway-trainings'],
    queryFn: async () => {
      try {
        const res = await apiClient.getBizTrainings();
        const items = res.data.data?.trainings || res.data.data?.items || [];
        return (Array.isArray(items) ? items : []).map((t: any) => ({
          value: t.id,
          label: `${t.title}${t.price ? ' — ' + formatPrice(t.price) : ''}`,
        }));
      } catch {
        return [];
      }
    },
  });

  // Tous les types d'articles du catalogue éligibles à l'épargne
  const ITEM_TYPES = [
    { value: 'PRODUCT', label: 'Produit' },
    { value: 'SERVICE', label: 'Service' },
    { value: 'ROOM', label: 'Chambre' },
    { value: 'RENTAL', label: 'Location' },
    { value: 'EVENT', label: 'Événement (billet)' },
    { value: 'TRAINING', label: 'Formation' },
  ];
  const TYPE_LABELS: Record<string, string> = Object.fromEntries(
    ITEM_TYPES.map((t) => [t.value, t.label])
  );
  const itemOptionsMap: Record<string, any[]> = {
    PRODUCT: productsData || [],
    SERVICE: servicesData || [],
    ROOM: roomsData || [],
    RENTAL: rentalsData || [],
    EVENT: eventsData || [],
    TRAINING: trainingsData || [],
  };

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
      setError('Choisissez un article');
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

  // ScopePicker — articles + catégories selon le type choisi
  const batchItemsMap: Record<string, any[]> = {
    PRODUCT: batchProducts || [],
    SERVICE: batchServices || [],
    ROOM: batchRooms || [],
    RENTAL: batchRentals || [],
    EVENT: batchEvents || [],
    TRAINING: batchTrainings || [],
  };
  const batchCatsMap: Record<string, any[]> = {
    PRODUCT: batchProductCats || [],
    SERVICE: batchServiceCats || [],
  };
  const batchScopeItems = useMemo(
    () => batchItemsMap[batchItemType] || [],
    [batchItemType, batchItemsMap]
  );
  const batchScopeCats = useMemo(
    () => batchCatsMap[batchItemType] || [],
    [batchItemType, batchCatsMap]
  );

  const createBatch = async () => {
    setBatchCreating(true);
    setBatchError('');
    setBatchResult('');
    try {
      const res = await apiClient.createLayawayOffersBatch({
        itemType: batchItemType,
        scope: batchScope.scope,
        categoryIds: batchScope.categoryIds,
        itemIds: batchScope.itemIds,
        durationDays: batchDuration,
        minInstallment: batchMinInstallment,
      });
      const r = res.data?.data || {};
      setBatchResult(
        `${r.activated || 0} épargne(s) activée(s)${r.skipped ? `, ${r.skipped} sans prix ignorée(s)` : ''}`
      );
      setBatchScope({ scope: 'ALL', categoryIds: [], itemIds: [] });
      qc.invalidateQueries({ queryKey: ['layaway-offers'] });
    } catch (e: any) {
      setBatchError(e?.response?.data?.message || e?.message || "Erreur lors de l'activation en masse");
    } finally {
      setBatchCreating(false);
    }
  };

  const offers = Array.isArray(offersData) ? offersData : [];
  const plans = Array.isArray(plansData) ? plansData : [];
  const activePlans = plans.filter(
    (p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
  );
  const itemOptions = itemOptionsMap[itemType] || [];

  if (statsLoading || offersLoading || plansLoading)
    return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Épargne Achat"
        description="Laissez vos clients épargner pour vos produits — ventes garanties, argent sécurisé en escrow"
        breadcrumbs={[{ label: 'Épargne Achat' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBatch(true)}>
              <Layers className="h-4 w-4 mr-1.5" /> Activer en masse
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Activer l'épargne
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard
          icon={<PiggyBank className="h-5 w-5" />}
          label="Plans en cours"
          value={stats?.activePlans ?? 0}
        />
        <StatsCard
          icon={<Lock className="h-5 w-5" />}
          label="Séquestré (escrow)"
          value={formatPrice(stats?.totalEscrowed ?? 0)}
        />
        <StatsCard
          icon={<Target className="h-5 w-5" />}
          label="Prêts à valider"
          value={stats?.readyPlans ?? 0}
        />
        <StatsCard
          icon={<Percent className="h-5 w-5" />}
          label="Commission à la vente"
          value="1%"
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-900/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          <strong>Gagnez des ventes sans crédit :</strong> vos clients épargnent via AfriBiz.
          L&apos;argent est bloqué en escrow et vous est libéré (moins 1% de commission) uniquement
          quand le client valide son achat. S&apos;il annule, il est remboursé — vous ne perdez
          rien.
        </p>
      </div>

      <Card title="Articles éligibles" titleIcon={<Sparkles className="h-4 w-4" />}>
        {offers.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="h-10 w-10" />}
            title="Aucune offre épargne"
            description="Activez l'épargne sur un article de votre catalogue (produit, service, chambre, location, événement, formation) pour permettre à vos clients d'acheter en épargnant."
            action={
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Activer l'épargne
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {offers.map((o: any) => (
              <div
                key={o.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div>
                  <p className="text-sm font-medium">{o.item?.name || o.itemId}</p>
                  <p className="text-xs text-gray-500">
                    {TYPE_LABELS[o.itemType] || o.itemType} · {formatPrice(o.item?.price)} ·{' '}
                    {o.durationDays} jours · min {formatPrice(o.minInstallment)} · {o.planCount}{' '}
                    plan(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={o.isActive ? 'success' : 'default'}>
                    {o.isActive ? 'Active' : 'Désactivée'}
                  </Badge>
                  <button
                    onClick={() => toggleOffer.mutate(o)}
                    className="text-gray-400 hover:text-brand transition-colors"
                    title={o.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {o.isActive ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
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
            Aucun plan épargne actif. Partagez vos articles avec le badge 🔒 Épargne pour attirer
            des clients.
          </p>
        ) : (
          <div className="space-y-2">
            {activePlans.map((p: any) => {
              const st = planStatusLabel[p.status] || { label: p.status, variant: 'default' };
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div>
                    <p className="text-sm font-medium">{p.itemName}</p>
                    <p className="text-xs text-gray-500">
                      Client #{String(p.clientId).slice(0, 8)} · {formatPrice(p.savedAmount)} /{' '}
                      {formatPrice(p.targetAmount)} · {p.contributions?.length || 0} cotisation(s)
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

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Activer l'épargne sur un article"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Type d'article</label>
            <Select
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value);
                setItemId('');
              }}
              options={ITEM_TYPES}
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
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Durée max (jours)
              </label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Cotisation min (FCFA)
              </label>
              <input
                type="number"
                value={minInstallment}
                onChange={(e) => setMinInstallment(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              {error}
            </p>
          )}
          <Button variant="primary" className="w-full" onClick={createOffer} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            {creating ? 'Activation...' : "Activer l'épargne sécurisée"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={showBatch}
        onClose={() => setShowBatch(false)}
        title="Activer l'épargne en masse"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Activez l&apos;épargne sur tout un type de catalogue, une catégorie ou des articles
            précis — une seule action, plusieurs offres créées.
          </p>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Type d'article</label>
            <Select
              value={batchItemType}
              onChange={(e) => {
                setBatchItemType(e.target.value);
                setBatchScope({ scope: 'ALL', categoryIds: [], itemIds: [] });
              }}
              options={ITEM_TYPES}
            />
          </div>
          <ScopePicker
            value={batchScope}
            onChange={setBatchScope}
            label="Quels articles ?"
            help={
              batchItemType === 'PRODUCT' || batchItemType === 'SERVICE'
                ? 'Tout, une catégorie ou des articles précis.'
                : 'Tout ou des articles précis (pas de catégories pour ce type).'
            }
            categories={batchScopeCats}
            items={batchScopeItems}
            itemTypeLabel={TYPE_LABELS[batchItemType]?.toLowerCase() + 's'}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Durée max (jours)
              </label>
              <input
                type="number"
                value={batchDuration}
                onChange={(e) => setBatchDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Cotisation min (FCFA)
              </label>
              <input
                type="number"
                value={batchMinInstallment}
                onChange={(e) => setBatchMinInstallment(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
          {batchError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              {batchError}
            </p>
          )}
          {batchResult && (
            <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
              {batchResult}
            </p>
          )}
          <Button
            variant="primary"
            className="w-full"
            onClick={createBatch}
            disabled={batchCreating}
          >
            {batchCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Layers className="h-4 w-4 mr-2" />
            )}
            {batchCreating ? 'Activation...' : 'Activer en masse'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
