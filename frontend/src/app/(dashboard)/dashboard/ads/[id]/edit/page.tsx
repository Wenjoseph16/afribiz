'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useAdCampaign } from '@/features/adsHooks';
import {
  ArrowLeft, Save, Loader2,
} from 'lucide-react';
import { AD_FORMAT_LABELS, AD_PLACEMENT_PAGE_LABELS, type AdFormat, type AdPlacementPage, type AdPlacementPosition } from '@/types/ads';
import Link from 'next/link';

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params.id as string;

  const { data: campaign, isLoading } = useAdCampaign(id);

  const [form, setForm] = useState({
    name: '', description: '', objective: 'BRAND_AWARENESS', budget: '',
    startDate: '', endDate: '', phone: '', whatsapp: '', email: '', companyName: '',
    website: '', country: '', city: '',
  });
  const [creatives, setCreatives] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name || '',
        description: campaign.description || '',
        objective: campaign.objective || 'BRAND_AWARENESS',
        budget: campaign.budget?.toString() || '',
        startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
        endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
        phone: campaign.phone || '',
        whatsapp: campaign.whatsapp || '',
        email: campaign.email || '',
        companyName: campaign.companyName || '',
        website: campaign.website || '',
        country: campaign.country || '',
        city: campaign.city || '',
      });
      if (campaign.creatives?.length > 0) {
        setCreatives(campaign.creatives.map((c: any) => ({
          id: c.id,
          adText: c.adText || '',
          mainImage: c.mainImage || '',
          destinationUrl: c.destinationUrl || '',
          cta: c.cta || '',
          placementPage: c.placementPage || 'BUSINESS_PUBLIC_PAGE',
          placementPosition: c.placementPosition || 'HERO_BANNER',
          format: c.format || 'BANNER_HORIZONTAL',
        })));
      }
    }
  }, [campaign]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/ads/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads', id] });
      qc.invalidateQueries({ queryKey: ['ads', 'my-campaigns'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      ...form,
      budget: parseFloat(form.budget) || 0,
      creatives,
    });
  };

  const updateCreative = (index: number, field: string, value: string) => {
    setCreatives(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  if (isLoading) return <Loader className="py-20" />;
  if (!campaign) {
    return (
      <div className="space-y-6 animate-fade-in p-8 text-center">
        <p className="text-gray-500">Campagne introuvable</p>
        <Link href="/dashboard/ads"><Button variant="secondary">Retour</Button></Link>
      </div>
    );
  }

  const canEdit = ['PENDING', 'REJECTED', 'PAUSED'].includes(campaign.status);

  if (!canEdit) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Modification impossible"
          description={`La campagne "${campaign.name}" ne peut pas être modifiée car son statut est "${campaign.status}".`}
          actions={<Link href={`/dashboard/ads/${id}`}><Button variant="secondary"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader
        title="Modifier la campagne"
        description={campaign.name}
        breadcrumbs={[
          { label: 'Publicités', href: '/dashboard/ads' },
          { label: campaign.name, href: `/dashboard/ads/${id}` },
          { label: 'Modifier' },
        ]}
        actions={
          <Link href={`/dashboard/ads/${id}`}>
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />Annuler
            </Button>
          </Link>
        }
      />

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Campagne mise à jour avec succès !
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg" title="Informations générales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nom de la campagne</label>
              <input type="text" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Objectif</label>
              <select value={form.objective} onChange={e => setForm(p => ({...p, objective: e.target.value}))} className={inputCls}>
                <option value="BRAND_AWARENESS">Notoriété</option>
                <option value="TRAFFIC">Trafic</option>
                <option value="LEADS">Prospects</option>
                <option value="SALES">Ventes</option>
                <option value="PROMOTION">Promotion</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Budget (FCFA)</label>
              <input type="number" value={form.budget} onChange={e => setForm(p => ({...p, budget: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Début</label>
              <input type="date" required value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fin</label>
              <input type="date" required value={form.endDate} onChange={e => setForm(p => ({...p, endDate: e.target.value}))} className={inputCls} />
            </div>
          </div>
        </Card>

        <Card padding="lg" title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Société</label>
              <input type="text" value={form.companyName} onChange={e => setForm(p => ({...p, companyName: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Site web</label>
              <input type="url" value={form.website} onChange={e => setForm(p => ({...p, website: e.target.value}))} className={inputCls} placeholder="https://" />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>WhatsApp</label>
              <input type="tel" value={form.whatsapp} onChange={e => setForm(p => ({...p, whatsapp: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pays</label>
              <input type="text" value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input type="text" value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className={inputCls} />
            </div>
          </div>
        </Card>

        {creatives.map((creative, index) => (
          <Card key={index} padding="lg" title={`Créatif #${index + 1}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Texte publicitaire</label>
                <input type="text" value={creative.adText} onChange={e => updateCreative(index, 'adText', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CTA</label>
                <input type="text" value={creative.cta} onChange={e => updateCreative(index, 'cta', e.target.value)} className={inputCls} placeholder="Découvrir, Acheter..." />
              </div>
              <div>
                <label className={labelCls}>Image (URL)</label>
                <input type="url" value={creative.mainImage} onChange={e => updateCreative(index, 'mainImage', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>URL de destination</label>
                <input type="url" value={creative.destinationUrl} onChange={e => updateCreative(index, 'destinationUrl', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Emplacement</label>
                <select value={creative.placementPage} onChange={e => updateCreative(index, 'placementPage', e.target.value)} className={inputCls}>
                  {Object.entries(AD_PLACEMENT_PAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Position</label>
                <select value={creative.placementPosition} onChange={e => updateCreative(index, 'placementPosition', e.target.value)} className={inputCls}>
                  {[
                    ['HERO_BANNER', 'Bannière héros'], ['TOP_BANNER', 'Bannière haut'], ['BOTTOM_BANNER', 'Bannière bas'],
                    ['SIDEBAR', 'Barre latérale'], ['SPONSORED_CARD', 'Carte sponsorisée'],
                    ['CAROUSEL', 'Carrousel'], ['PROMO_WIDGET', 'Widget promo'],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        ))}

        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 -mx-4 lg:-mx-8 rounded-t-2xl border-t border-gray-200 dark:border-gray-700">
          <Link href={`/dashboard/ads/${id}`}>
            <Button type="button" variant="ghost">Annuler</Button>
          </Link>
          <Button type="submit" isLoading={updateMutation.isPending} disabled={!form.name.trim() || updateMutation.isPending}>
            {updateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Enregistrement...</>
            ) : (
              <><Save className="h-4 w-4 mr-1.5" />Enregistrer</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
