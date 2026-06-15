'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAdCampaign, usePauseAdCampaign, useResumeAdCampaign, useDeleteAdCampaign } from '@/features/adsHooks';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Megaphone, ArrowLeft, PauseCircle, PlayCircle, Trash2, Edit3,
  Eye, MousePointerClick, DollarSign, Calendar, Target, MapPin,
  Image as ImageIcon, ExternalLink, BarChart3, TrendingUp, Users,
  FileText, Smartphone, CheckCircle2, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'default' | 'danger' | 'info'> = {
  ACTIVE: 'success', PENDING: 'warning', COMPLETED: 'default',
  REJECTED: 'danger', SUSPENDED: 'danger', PAUSED: 'info',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active', PENDING: 'En validation', COMPLETED: 'Terminée',
  REJECTED: 'Refusée', SUSPENDED: 'Suspendue', PAUSED: 'En pause',
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: campaign, isLoading, error } = useAdCampaign(id);
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['ad-campaign-stats', id],
    queryFn: async () => { const res = await apiClient.getAdCampaignStats(id); return res.data.data; },
    enabled: !!id,
    refetchInterval: campaign?.status === 'ACTIVE' ? 30000 : false,
  });

  const pauseMutation = usePauseAdCampaign();
  const resumeMutation = useResumeAdCampaign();
  const deleteMutation = useDeleteAdCampaign();

  if (isLoading) return <Loader className="py-20" />;
  if (error || !campaign) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Campagne introuvable" description="Cette campagne n'existe pas ou a été supprimée." />
        <EmptyState icon={<Megaphone className="h-8 w-8" />} title="Campagne introuvable" description="" action={<Link href="/dashboard/ads"><Button>Retour aux campagnes</Button></Link>} />
      </div>
    );
  }

  const creative = campaign.creatives?.[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/ads')}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/ads/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <Edit3 className="h-3.5 w-3.5" />
              Modifier
            </Button>
          </Link>
          {campaign.status === 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={() => pauseMutation.mutate(id)} isLoading={pauseMutation.isPending}>
              <PauseCircle className="h-3.5 w-3.5" />
              Mettre en pause
            </Button>
          )}
          {campaign.status === 'PAUSED' && (
            <Button variant="primary" size="sm" onClick={() => resumeMutation.mutate(id)} isLoading={resumeMutation.isPending}>
              <PlayCircle className="h-3.5 w-3.5" />
              Reprendre
            </Button>
          )}
          {deleteConfirm ? (
            <div className="flex items-center gap-1">
              <Button variant="danger" size="sm" onClick={() => { deleteMutation.mutate(id); router.push('/dashboard/ads'); }} isLoading={deleteMutation.isPending}>
                Confirmer la suppression
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>Annuler</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Créée le {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
              <Badge variant={STATUS_BADGE[campaign.status] || 'default'} size="md">
                {STATUS_LABELS[campaign.status] || campaign.status}
              </Badge>
            </div>
            {campaign.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{campaign.description}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Objectif</span>
                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <Target className="h-3.5 w-3.5 text-brand" />
                  {campaign.objective?.replace(/_/g, ' ') || '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Budget</span>
                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  {(Number(campaign.budget) || 0).toLocaleString()} FCFA
                </p>
              </div>
              <div>
                <span className="text-gray-500">Début</span>
                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Fin</span>
                <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-red-500" />
                  {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
              <span className="text-gray-500 flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {campaign._count?.impressions ?? 0} impressions</span>
              <span className="text-gray-500 flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" /> {campaign._count?.clicks ?? 0} clics</span>
              <span className="text-gray-500 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {campaign._count?.conversions ?? 0} conversions</span>
            </div>
          </Card>

          {/* Stats */}
          <Card padding="lg" title="Statistiques" titleIcon={<BarChart3 className="h-5 w-5" />}>
            {statsLoading ? (
              <Loader className="py-8" />
            ) : stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Impressions</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.impressions?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                    <p className="text-xs text-purple-600 dark:text-purple-400">Clics</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.clicks?.toLocaleString() ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">CTR</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.ctr ?? 0}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                    <p className="text-xs text-amber-600 dark:text-amber-400">Dépenses</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{(stats.totalSpend ?? 0).toLocaleString()} FCFA</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">Conversions</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.conversions ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                    <p className="text-xs text-rose-600 dark:text-rose-400">Taux de conversion</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.conversionRate ?? 0}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                    <p className="text-xs text-cyan-600 dark:text-cyan-400">Budget</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{(stats.budget ?? 0).toLocaleString()} FCFA</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Bar chart: stats overview */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs font-medium text-gray-500 mb-3">Impressions vs Clics vs Conversions</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={[
                        { name: 'Impressions', value: stats.impressions ?? 0, fill: '#3B82F6' },
                        { name: 'Clics', value: stats.clicks ?? 0, fill: '#8B5CF6' },
                        { name: 'Conversions', value: stats.conversions ?? 0, fill: '#10B981' },
                      ]}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie chart: budget distribution */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs font-medium text-gray-500 mb-3">Répartition des dépenses</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Budget total', value: Math.max(stats.budget - stats.totalSpend, 0), color: '#10B981' },
                            { name: 'Dépensé', value: stats.totalSpend, color: '#F59E0B' },
                          ]}
                          cx="50%" cy="50%" innerRadius={30} outerRadius={70}
                          paddingAngle={4} dataKey="value"
                        >
                          {[{ name: 'Budget total', color: '#10B981' }, { name: 'Dépensé', color: '#F59E0B' }].map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </div>

      {/* Sidebar */}
      <div className="space-y-6">
          {/* Creative */}
          <Card padding="lg" title="Créatif publicitaire" titleIcon={<ImageIcon className="h-5 w-5" />}>
            {creative ? (
              <div className="space-y-3">
                {creative.mainImage && (
                  <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                    <Image src={creative.mainImage ?? ''} alt={campaign.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                {creative.adText && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{creative.adText}"</p>
                )}
                {creative.destinationUrl && (
                  <a href={creative.destinationUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-brand hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {creative.destinationUrl}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun créatif associé</p>
            )}
          </Card>

          {/* Contact info */}
          <Card padding="lg" title="Contact" titleIcon={<Users className="h-5 w-5" />}>
            <div className="space-y-2 text-sm">
              {campaign.companyName && <p><span className="text-gray-500">Société: </span><span className="text-gray-900 dark:text-gray-100 font-medium">{campaign.companyName}</span></p>}
              {campaign.phone && <p><span className="text-gray-500">Tél: </span><span className="text-gray-900 dark:text-gray-100">{campaign.phone}</span></p>}
              {campaign.whatsapp && <p><span className="text-gray-500">WhatsApp: </span><span className="text-gray-900 dark:text-gray-100">{campaign.whatsapp}</span></p>}
              {campaign.email && <p><span className="text-gray-500">Email: </span><span className="text-gray-900 dark:text-gray-100">{campaign.email}</span></p>}
              {!campaign.companyName && !campaign.phone && !campaign.email && (
                <p className="text-gray-500">Aucune information de contact</p>
              )}
            </div>
          </Card>

          {/* Invoice & Payment in sidebar */}
          <Card padding="lg" title="Facture" titleIcon={<FileText className="h-5 w-5" />}>
            <InvoiceSection campaignId={id} campaign={campaign} />
          </Card>

          {/* Geo targeting */}
          {campaign.geoTarget && campaign.geoTarget.length > 0 && (
            <Card padding="lg" title="Ciblage géographique" titleIcon={<MapPin className="h-5 w-5" />}>
              <div className="flex flex-wrap gap-1.5">
                {campaign.geoTarget.map((loc: string) => (
                  <Badge key={loc} variant="brand" size="xs">{loc}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InvoiceSection({ campaignId, campaign }: { campaignId: string; campaign: any }) {
  const qc = useQueryClient();
  const [payModal, setPayModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [provider, setProvider] = useState<'TMONEY' | 'FLOOZ' | 'WAVE'>('TMONEY');

  const { data: invoiceData } = useQuery({
    queryKey: ['ad-invoice', campaignId],
    queryFn: async () => {
      const res = await apiClient.get(`/ads/${campaignId}`);
      return (res.data as any).data?.invoice;
    },
    enabled: !!campaignId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/ads/${campaignId}/invoice`);
      return (res.data as any).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ad-campaign', campaignId] });
      qc.invalidateQueries({ queryKey: ['ad-invoice', campaignId] });
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/payments/processor/initiate', {
        amount: invoiceData?.amount || campaign.budget || 0,
        provider,
        phone,
        description: `Paiement campagne pub: ${campaign.name}`,
        metadata: { campaignId, invoiceId: invoiceData?.id },
      });
      return (res.data as any).data;
    },
    onSuccess: () => {
      setPayModal(false);
      qc.invalidateQueries({ queryKey: ['ad-invoice', campaignId] });
    },
  });

  const invoice = campaign.invoice || invoiceData;

  if (invoice) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div>
            <p className="text-xs text-gray-500">Facture</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{invoice.number || 'N° en cours'}</p>
          </div>
          <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'PENDING' ? 'warning' : 'default'}>
            {invoice.status === 'PAID' ? 'Payée' : invoice.status === 'PENDING' ? 'En attente' : invoice.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Montant</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{(invoice.amount || 0).toLocaleString()} FCFA</p>
        </div>
        {invoice.status === 'PENDING' && (
          <Button className="w-full" onClick={() => setPayModal(true)}>
            <Smartphone className="h-4 w-4" />
            Payer avec Mobile Money
          </Button>
        )}
        {invoice.status === 'PAID' && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Paiement confirmé
          </div>
        )}
        <Modal open={payModal} onClose={() => setPayModal(false)} title="Paiement Mobile Money">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opérateur</label>
              <div className="grid grid-cols-3 gap-2">
                {(['TMONEY', 'FLOOZ', 'WAVE'] as const).map((p) => (
                  <button key={p} onClick={() => setProvider(p)}
                    className={cn('p-3 rounded-xl border text-sm font-medium transition-colors text-center',
                      provider === p
                        ? 'border-brand bg-brand-50 dark:bg-brand-900/20 text-brand'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    )}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro de téléphone</label>
              <Input placeholder="+228 XX XX XX XX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm">Montant</span>
              <span className="text-lg font-bold">{(invoice.amount || 0).toLocaleString()} FCFA</span>
            </div>
            <Button className="w-full" onClick={() => payMutation.mutate()} isLoading={payMutation.isPending} disabled={!phone.trim()}>
              {payMutation.isPending ? 'Paiement en cours...' : `Payer avec ${provider}`}
            </Button>
            {payMutation.data && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm">
                {payMutation.data.message || 'Paiement initié. Confirmez sur votre téléphone.'}
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">Aucune facture générée pour cette campagne.</p>
      <Button className="w-full" variant="secondary" onClick={() => generateMutation.mutate()} isLoading={generateMutation.isPending}>
        <FileText className="h-4 w-4" />
        Générer la facture
      </Button>
      {generateMutation.data && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm">
          Facture générée avec succès !
        </div>
      )}
    </div>
  );
}
