'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package, Truck, Briefcase, Building2, Wrench,
  Phone, Mail, Globe, MapPin, MessageCircle, Camera, Music4, FileText, Star,
  ChevronLeft, ChevronRight, Save,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePartner, useUpdatePartner } from '@/features/partnerHooks';

const CATEGORIES = [
  { value: 'FOURNISSEUR', label: 'Fournisseur', icon: Package },
  { value: 'LIVREUR', label: 'Livreur', icon: Truck },
  { value: 'SERVICE', label: 'Service', icon: Briefcase },
  { value: 'COMMERCIAL', label: 'Commercial', icon: Building2 },
  { value: 'TECHNIQUE', label: 'Technique', icon: Wrench },
];

const COLLAB_LEVELS = ['PONCTUEL', 'REGULIER', 'STRATEGIQUE', 'PREMIUM'];

export default function EditPartnerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: partner, isLoading, error } = usePartner(id);
  const updatePartner = useUpdatePartner();
  const [form, setForm] = useState<any>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (partner && !loaded) {
      const p = partner as any;
      setForm({
        name: p.name || '', category: p.category || 'FOURNISSEUR',
        description: p.description || '', specialite: p.specialite || '',
        phone: p.phone || '', whatsapp: p.whatsapp || '', email: p.email || '',
        website: p.website || '', address: p.address || '', city: p.city || '', country: p.country || '',
        servicesProposes: p.servicesProposes || '', produitsFournis: p.produitsFournis || '',
        zonesCouvertes: p.zonesCouvertes || '', horairesDisponibilite: p.horairesDisponibilite || '',
        facebook: p.facebook || '', instagram: p.instagram || '',
        linkedin: p.linkedin || '', tiktok: p.tiktok || '',
        collaborationLevel: p.collaborationLevel || 'PONCTUEL',
      });
      setLoaded(true);
    }
  }, [partner, loaded]);

  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    await updatePartner.mutateAsync({ id, data: form });
    router.push(`/dashboard/partners/${id}`);
  };

  if (isLoading) return <Loader />;
  if (error || !partner) return <ErrorState message="Partenaire non trouvé" />;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title="Modifier le partenaire"
        description="Mettez à jour les informations du partenaire"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Partenaires', href: '/dashboard/partners' },
          { label: (partner as any).name, href: `/dashboard/partners/${id}` },
          { label: 'Modifier' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
              <Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = form.category === cat.value;
                  return (
                    <button key={cat.value} type="button" onClick={() => update('category', cat.value)}
                      className={`p-2 rounded-lg border-2 text-center transition-all text-xs ${
                        isActive ? 'border-brand bg-brand/5' : 'border-gray-200 dark:border-gray-700'
                      }`}>
                      <Icon className={`h-4 w-4 mx-auto mb-0.5 ${isActive ? 'text-brand' : 'text-gray-400'}`} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spécialité</label>
              <Input value={form.specialite || ''} onChange={(e) => update('specialite', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Phone className="h-3.5 w-3.5 inline mr-1" /> Téléphone</label>
              <Input value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><MessageCircle className="h-3.5 w-3.5 inline mr-1" /> WhatsApp</label>
              <Input value={form.whatsapp || ''} onChange={(e) => update('whatsapp', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Mail className="h-3.5 w-3.5 inline mr-1" /> Email</label>
              <Input value={form.email || ''} onChange={(e) => update('email', e.target.value)} type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Globe className="h-3.5 w-3.5 inline mr-1" /> Site web</label>
              <Input value={form.website || ''} onChange={(e) => update('website', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><MapPin className="h-3.5 w-3.5 inline mr-1" /> Adresse</label>
              <Input value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
              <Input value={form.city || ''} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pays</label>
              <Input value={form.country || ''} onChange={(e) => update('country', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Services proposés</label>
              <textarea value={form.servicesProposes || ''} onChange={(e) => update('servicesProposes', e.target.value)} rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produits fournis</label>
              <textarea value={form.produitsFournis || ''} onChange={(e) => update('produitsFournis', e.target.value)} rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zones couvertes</label>
              <Input value={form.zonesCouvertes || ''} onChange={(e) => update('zonesCouvertes', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horaires</label>
              <Input value={form.horairesDisponibilite || ''} onChange={(e) => update('horairesDisponibilite', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Globe className="h-3.5 w-3.5 inline mr-1 text-blue-600" /> Facebook</label>
              <Input value={form.facebook || ''} onChange={(e) => update('facebook', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Camera className="h-3.5 w-3.5 inline mr-1 text-pink-600" /> Instagram</label>
              <Input value={form.instagram || ''} onChange={(e) => update('instagram', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Briefcase className="h-3.5 w-3.5 inline mr-1 text-blue-700" /> LinkedIn</label>
              <Input value={form.linkedin || ''} onChange={(e) => update('linkedin', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"><Music4 className="h-3.5 w-3.5 inline mr-1" /> TikTok</label>
              <Input value={form.tiktok || ''} onChange={(e) => update('tiktok', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Niveau collaboration</label>
              <div className="grid grid-cols-4 gap-2">
                {COLLAB_LEVELS.map((level) => (
                  <button key={level} type="button" onClick={() => update('collaborationLevel', level)}
                    className={`p-2 rounded-lg border-2 text-center transition-all text-xs ${
                      form.collaborationLevel === level ? 'border-brand bg-brand/5' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                    <Star className={`h-4 w-4 mx-auto mb-0.5 ${form.collaborationLevel === level ? 'text-brand' : 'text-gray-400'}`} />
                    {level.charAt(0) + level.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1.5" /> Annuler
          </Button>
          <Button type="submit" disabled={updatePartner.isPending}>
            <Save className="h-4 w-4 mr-1.5" /> {updatePartner.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
