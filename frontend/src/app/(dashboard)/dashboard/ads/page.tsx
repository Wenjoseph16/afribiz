'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useMyAdCampaigns, usePauseAdCampaign, useResumeAdCampaign, useDeleteAdCampaign } from '@/features/adsHooks';
import {
  AD_FORMAT_LABELS, AD_PLACEMENT_PAGE_LABELS, AD_OBJECTIVE_LABELS,
  type AdFormat, type AdPlacementPage, type AdPlacementPosition,
} from '@/types/ads';
import { Megaphone, Plus, TrendingUp, Eye, MousePointerClick, DollarSign, Calendar, BarChart3, PauseCircle, PlayCircle, Trash2, ExternalLink, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'default' | 'danger' | 'info'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  COMPLETED: 'default',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
  PAUSED: 'info',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PENDING: 'En validation',
  COMPLETED: 'Terminée',
  REJECTED: 'Refusée',
  SUSPENDED: 'Suspendue',
  PAUSED: 'En pause',
};

export default function AdsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [statsCampaignId, setStatsCampaignId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', objective: 'BRAND_AWARENESS', budget: '', startDate: '', endDate: '',
    phone: '', whatsapp: '', email: '', companyName: '',
    mainImage: '', adText: '', destinationUrl: '',
    advertiserType: 'BUSINESS' as 'BUSINESS' | 'DEVELOPER' | 'EXTERNAL',
    placementPage: 'DASHBOARD_BUSINESS' as AdPlacementPage,
    placementPosition: 'SPONSORED_CARD' as AdPlacementPosition,
    format: 'SPONSORED_CARD' as AdFormat,
    packageId: '',
    acceptedTerms: false,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { data: campaignsRes, isLoading, error } = useMyAdCampaigns();
  const pauseMutation = usePauseAdCampaign();
  const resumeMutation = useResumeAdCampaign();
  const deleteMutation = useDeleteAdCampaign();

  const { data: packages } = useQuery({
    queryKey: ['ad-packages'],
    queryFn: async () => {
      try {
        const res = await apiClient.adminGetAdPackages();
        return res.data.data?.packages || res.data.data || [];
      } catch {
        return [];
      }
    },
  });

  const pkgList = Array.isArray(packages) ? packages : (packages as any)?.packages ?? [];

  const { data: statsData } = useQuery({
    queryKey: ['my-ad-stats-summary'],
    queryFn: async () => {
      const res = await apiClient.getMyAdCampaigns();
      const camps = Array.isArray(res.data.data) ? res.data.data : [];
      return {
        total: camps.length,
        active: camps.filter((c: any) => c.status === 'ACTIVE').length,
        paused: camps.filter((c: any) => c.status === 'PAUSED').length,
        pending: camps.filter((c: any) => c.status === 'PENDING').length,
        impressions: camps.reduce((s: number, c: any) => s + (c._count?.impressions || 0), 0),
        clicks: camps.reduce((s: number, c: any) => s + (c._count?.clicks || 0), 0),
        spend: camps.reduce((s: number, c: any) => s + (Number(c.budget) || 0), 0),
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createAdCampaign(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads', 'my-campaigns'] });
      qc.invalidateQueries({ queryKey: ['my-ad-stats-summary'] });
      setShowForm(false);
      setForm({ name: '', description: '', objective: 'BRAND_AWARENESS', budget: '', startDate: '', endDate: '', phone: '', whatsapp: '', email: '', companyName: '', mainImage: '', adText: '', destinationUrl: '', advertiserType: 'BUSINESS', placementPage: 'DASHBOARD_BUSINESS', placementPosition: 'SPONSORED_CARD', format: 'SPONSORED_CARD', packageId: '', acceptedTerms: false });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    const errors: string[] = [];
    if (form.advertiserType === 'EXTERNAL' && !form.acceptedTerms) {
      errors.push('Vous devez accepter les conditions générales pour les annonceurs externes');
    }
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    createMutation.mutate({
      ...form,
      budget: parseFloat(form.budget) || 0,
      packageId: form.packageId || packages?.[0]?.id || undefined,
      creatives: [{
        placementPage: form.placementPage,
        placementPosition: form.placementPosition,
        format: form.format,
        mainImage: form.mainImage || undefined,
        adText: form.adText || undefined,
        destinationUrl: form.destinationUrl || undefined,
        targetCountries: [],
        targetCities: [],
      }],
    });
  };

  const campaigns = Array.isArray(campaignsRes) ? campaignsRes : (campaignsRes as any)?.campaigns ?? [];

  const statsCards = [
    { label: 'Total campagnes', value: statsData?.total ?? 0, icon: Megaphone, color: 'text-brand' },
    { label: 'Actives', value: statsData?.active ?? 0, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Impressions', value: statsData?.impressions?.toLocaleString() ?? '0', icon: Eye, color: 'text-blue-600' },
    { label: 'Clics', value: statsData?.clicks?.toLocaleString() ?? '0', icon: MousePointerClick, color: 'text-purple-600' },
    { label: 'Budget total', value: `${(statsData?.spend ?? 0).toLocaleString()} FCFA`, icon: DollarSign, color: 'text-amber-600' },
  ];

  const campaignStatsQuery = (id: string) => ({
    queryKey: ['campaign-stats', id],
    queryFn: async () => {
      const res = await apiClient.getAdCampaignStats(id);
      return res.data.data;
    },
    enabled: statsCampaignId === id,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Campagnes publicitaires"
        description="Créez et gérez vos campagnes AfriBiz Ads"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle campagne
          </Button>
        }
      />

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            Erreur lors du chargement des campagnes. Veuillez réessayer.
          </p>
        </Card>
      )}

      {/* Stats dashboard */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} padding="sm" className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.label} padding="sm">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Créer une campagne
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de la campagne</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="Ex: Promotion rentrée 2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (FCFA)</label>
                <input type="number" required value={form.budget} onChange={e => setForm(p => ({...p, budget: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objectif</label>
                <select value={form.objective} onChange={e => setForm(p => ({...p, objective: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                  <option value="BRAND_AWARENESS">Notoriété</option>
                  <option value="TRAFFIC">Trafic</option>
                  <option value="LEADS">Prospects</option>
                  <option value="SALES">Ventes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Début</label>
                <input type="date" required value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
                <input type="date" required value={form.endDate} onChange={e => setForm(p => ({...p, endDate: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="+228 90 00 00 00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
                <input type="tel" value={form.whatsapp} onChange={e => setForm(p => ({...p, whatsapp: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="+228 90 00 00 00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package</label>
                <select value={form.packageId} onChange={e => setForm(p => ({...p, packageId: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                  <option value="">Sélectionner un package...</option>
                  {pkgList.map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} — {Number(pkg.price).toLocaleString()} {pkg.currency}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none"
                  placeholder="Décrivez votre campagne..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type d'annonceur</label>
                <select value={form.advertiserType} onChange={e => setForm(p => ({...p, advertiserType: e.target.value as any}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                  <option value="BUSINESS">Business</option>
                  <option value="DEVELOPER">Développeur</option>
                  <option value="EXTERNAL">Externe</option>
                </select>
                {form.advertiserType === 'EXTERNAL' && (
                  <div className="mt-3 p-3 rounded-xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/30">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={form.acceptedTerms} onChange={e => setForm(p => ({...p, acceptedTerms: e.target.checked}))}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30" />
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-white">J'accepte les conditions générales</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                          En tant qu'annonceur externe, je certifie que mes informations sont exactes et
                          j'accepte les <button type="button" className="text-brand underline">conditions d'utilisation</button> d'AfriBiz Ads.
                          Un contrat vous sera soumis après validation de la campagne par l'administrateur.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                <select value={form.format} onChange={e => setForm(p => ({...p, format: e.target.value as AdFormat}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                  {Object.entries(AD_FORMAT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emplacement</label>
                <select value={form.placementPage} onChange={e => setForm(p => ({...p, placementPage: e.target.value as AdPlacementPage}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                  {Object.entries(AD_PLACEMENT_PAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
                <select value={form.placementPosition} onChange={e => setForm(p => ({...p, placementPosition: e.target.value as AdPlacementPosition}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                  {Object.entries({
                    HERO_BANNER: 'Bannière héros', TOP_BANNER: 'Bannière haut', BOTTOM_BANNER: 'Bannière bas',
                    SIDEBAR: 'Barre latérale', SPONSORED_CARD: 'Carte sponsorisée',
                    SPONSORED_RESULT: 'Résultat sponsorisé', CAROUSEL: 'Carrousel',
                    FEATURED_BLOCK: 'Bloc à la une', PROMO_WIDGET: 'Widget promo',
                    RECOMMENDED: 'Recommandé', POPUP: 'Popup',
                  }).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Créatif</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" value={form.mainImage} onChange={e => setForm(p => ({...p, mainImage: e.target.value}))}
                    className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="URL de l'image" />
                  <input type="text" value={form.adText} onChange={e => setForm(p => ({...p, adText: e.target.value}))}
                    className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="Texte publicitaire" />
                  <input type="url" value={form.destinationUrl} onChange={e => setForm(p => ({...p, destinationUrl: e.target.value}))}
                    className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="URL de destination" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" isLoading={createMutation.isPending}>Créer la campagne</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Campaign list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="sm" className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-8 w-8" />}
          title="Aucune campagne"
          description="Créez votre première campagne publicitaire pour atteindre plus de clients"
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Créer une campagne
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id}>
              <Card padding="sm" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{campaign.name}</p>
                    <Badge variant={STATUS_BADGE[campaign.status] || 'default'} size="xs">
                      {STATUS_LABELS[campaign.status] || campaign.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                    <span>{campaign.objective?.replace('_', ' ') || '-'}</span>
                    <span>·</span>
                    <span>{(Number(campaign.budget) || 0).toLocaleString()} FCFA</span>
                    {campaign.startDate && (
                      <>
                        <span>·</span>
                        <Calendar className="h-3 w-3 inline" />
                        {new Date(campaign.startDate).toLocaleDateString('fr-FR')} - {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                      </>
                    )}
                    <span>·</span>
                    <Eye className="h-3 w-3 inline" />
                    {campaign._count?.impressions ?? 0}
                    <span>·</span>
                    <MousePointerClick className="h-3 w-3 inline" />
                    {campaign._count?.clicks ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setStatsCampaignId(statsCampaignId === campaign.id ? null : campaign.id)}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Statistiques
                  </Button>
                  {campaign.status === 'ACTIVE' && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => pauseMutation.mutate(campaign.id)}
                      isLoading={pauseMutation.isPending}
                    >
                      <PauseCircle className="h-3.5 w-3.5" />
                      Pause
                    </Button>
                  )}
                  {campaign.status === 'PAUSED' && (
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => resumeMutation.mutate(campaign.id)}
                      isLoading={resumeMutation.isPending}
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      Reprendre
                    </Button>
                  )}
                  <Link href={`/dashboard/ads/${campaign.id}`}>
                    <Button variant="ghost" size="xs">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  {['PENDING', 'REJECTED', 'COMPLETED', 'PAUSED'].includes(campaign.status) && (
                    deleteConfirm === campaign.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="danger" size="xs" onClick={() => { deleteMutation.mutate(campaign.id); setDeleteConfirm(null); }} isLoading={deleteMutation.isPending}>
                          Confirmer
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm(campaign.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    )
                  )}
                </div>
              </Card>
              {/* Stats expand */}
              {statsCampaignId === campaign.id && (
                <CampaignStatsSection campaignId={campaign.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignStatsSection({ campaignId }: { campaignId: string }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['campaign-stats', campaignId],
    queryFn: async () => {
      const res = await apiClient.getAdCampaignStats(campaignId);
      return res.data.data;
    },
  });

  if (isLoading) return <Loader className="py-4" />;
  if (!stats) return null;

  return (
    <Card padding="sm" className="ml-4 mt-2 border-l-4 border-l-brand">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500">Impressions</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.impressions?.toLocaleString() ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Clics</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.clicks?.toLocaleString() ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">CTR</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.ctr ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Dépenses</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{(stats.totalSpend ?? 0).toLocaleString()} FCFA</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Conversions</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.conversions ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Taux conversion</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.conversionRate ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Budget</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{(stats.budget ?? 0).toLocaleString()} FCFA</p>
        </div>
      </div>
    </Card>
  );
}
