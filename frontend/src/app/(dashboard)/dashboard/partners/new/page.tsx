'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserPlus, Package, Truck, Briefcase, Building2, Wrench,
  Phone, Mail, Globe, MapPin, MessageCircle, Camera, Music4, FileText,
  ChevronLeft, ChevronRight, Save, Star,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreatePartner } from '@/features/partnerHooks';

const CATEGORIES = [
  { value: 'FOURNISSEUR', label: 'Fournisseur', icon: Package, desc: 'Matières premières, produits, équipements' },
  { value: 'LIVREUR', label: 'Livreur', icon: Truck, desc: 'Livreurs, agences transport, chauffeurs' },
  { value: 'SERVICE', label: 'Service', icon: Briefcase, desc: 'Freelances, développeurs, designers, consultants' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: Building2, desc: 'Distributeurs, revendeurs, sponsors' },
  { value: 'TECHNIQUE', label: 'Technique', icon: Wrench, desc: 'Maintenance, réparation, sécurité' },
];

const COLLAB_LEVELS = [
  { value: 'PONCTUEL', label: 'Ponctuel', desc: 'Collaboration occasionnelle' },
  { value: 'REGULIER', label: 'Régulier', desc: 'Collaboration fréquente' },
  { value: 'STRATEGIQUE', label: 'Stratégique', desc: 'Partenariat clé pour le business' },
  { value: 'PREMIUM', label: 'Premium', desc: 'Partenaire privilégié' },
];

export default function NewPartnerPage() {
  const router = useRouter();
  const createPartner = useCreatePartner();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', category: 'FOURNISSEUR', description: '', specialite: '',
    phone: '', whatsapp: '', email: '', website: '', address: '', city: '', country: '',
    servicesProposes: '', produitsFournis: '', zonesCouvertes: '', horairesDisponibilite: '',
    facebook: '', instagram: '', linkedin: '', tiktok: '',
    collaborationLevel: 'PONCTUEL',
    logo: '',
  });

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    try {
      await createPartner.mutateAsync(form);
      router.push('/dashboard/partners');
    } catch (e) { console.error(e); }
  };

  const CatIcon = CATEGORIES.find((c) => c.value === form.category)?.icon || Package;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <PageHeader
        title="Ajouter un partenaire"
        description="Centralisez toutes vos relations professionnelles"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Partenaires', href: '/dashboard/partners' },
          { label: 'Nouveau' },
        ]}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setStep(s)}
              className={cn(
                'w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-all',
                step === s
                  ? 'bg-brand text-white scale-110'
                  : step > s
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
              )}
            >
              {step > s ? '✓' : s}
            </button>
            {s < 6 && <div className={cn('h-0.5 flex-1 rounded', step > s ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700')} />}
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (step < 6) setStep(step + 1); else handleSubmit(); }}>
        {/* Step 1: General Info */}
        {step === 1 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">1. Informations générales</h2>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-brand transition-colors">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo / Photo</p>
                <p className="text-xs text-gray-500">Cliquez pour ajouter</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du partenaire *</label>
                <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Nom du partenaire" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de partenaire</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = form.category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => update('category', cat.value)}
                        className={cn(
                          'p-3 rounded-xl border-2 text-left transition-all',
                          isActive
                            ? 'border-brand bg-brand/5 dark:bg-brand/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <Icon className={cn('h-5 w-5 mb-1', isActive ? 'text-brand' : 'text-gray-400')} />
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Présentez le partenaire..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spécialité</label>
                <Input value={form.specialite} onChange={(e) => update('specialite', e.target.value)} placeholder="Ex: Plomberie, Développement web, Transport frigorifique..." />
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Contact Info */}
        {step === 2 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">2. Coordonnées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="h-3.5 w-3.5 inline mr-1" /> Téléphone
                </label>
                <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+225 01 02 03 04 05" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MessageCircle className="h-3.5 w-3.5 inline mr-1" /> WhatsApp
                </label>
                <Input value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+225 01 02 03 04 05" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="h-3.5 w-3.5 inline mr-1" /> Email
                </label>
                <Input value={form.email} onChange={(e) => update('email', e.target.value)} type="email" placeholder="contact@partenaire.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Globe className="h-3.5 w-3.5 inline mr-1" /> Site web
                </label>
                <Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="h-3.5 w-3.5 inline mr-1" /> Adresse
                </label>
                <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Adresse complète" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Abidjan" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pays</label>
                <Input value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="Côte d'Ivoire" />
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Professional Info */}
        {step === 3 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">3. Informations professionnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Services proposés</label>
                <textarea
                  value={form.servicesProposes}
                  onChange={(e) => update('servicesProposes', e.target.value)}
                  placeholder="Ex: Livraison express, Développement React, Conseil en marketing digital..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produits fournis</label>
                <textarea
                  value={form.produitsFournis}
                  onChange={(e) => update('produitsFournis', e.target.value)}
                  placeholder="Ex: Matières premières, Équipements, Produits finis..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zones couvertes</label>
                <Input value={form.zonesCouvertes} onChange={(e) => update('zonesCouvertes', e.target.value)} placeholder="Ex: Abidjan, Yamoussoukro, Bouaké..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horaires de disponibilité</label>
                <Input value={form.horairesDisponibilite} onChange={(e) => update('horairesDisponibilite', e.target.value)} placeholder="Ex: Lun-Ven 8h-18h, Sam 9h-13h" />
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Social Media */}
        {step === 4 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">4. Réseaux sociaux</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Globe className="h-3.5 w-3.5 inline mr-1 text-blue-600" /> Facebook
                </label>
                <Input value={form.facebook} onChange={(e) => update('facebook', e.target.value)} placeholder="URL Facebook" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Camera className="h-3.5 w-3.5 inline mr-1 text-pink-600" /> Instagram
                </label>
                <Input value={form.instagram} onChange={(e) => update('instagram', e.target.value)} placeholder="URL Instagram" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Briefcase className="h-3.5 w-3.5 inline mr-1 text-blue-700" /> LinkedIn
                </label>
                <Input value={form.linkedin} onChange={(e) => update('linkedin', e.target.value)} placeholder="URL LinkedIn" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Music4 className="h-3.5 w-3.5 inline mr-1" /> TikTok
                </label>
                <Input value={form.tiktok} onChange={(e) => update('tiktok', e.target.value)} placeholder="URL TikTok" />
              </div>
            </div>
          </Card>
        )}

        {/* Step 5: Documents & Collaboration Level */}
        {step === 5 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">5. Documents & Niveau de collaboration</h2>

            <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
              <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Documents professionnels</p>
              <p className="text-xs text-gray-500 mt-1">Contrat, licence, certifications, accord de partenariat</p>
              <Button type="button" variant="outline" size="sm" className="mt-3">
                <FileText className="h-4 w-4 mr-1.5" />
                Ajouter des documents
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Niveau de collaboration</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {COLLAB_LEVELS.map((level) => {
                  const isActive = form.collaborationLevel === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => update('collaborationLevel', level.value)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all',
                        isActive
                          ? 'border-brand bg-brand/5 dark:bg-brand/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <Star className={cn('h-5 w-5 mx-auto mb-1', isActive ? 'text-brand' : 'text-gray-400')} />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{level.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{level.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">6. Récapitulatif</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="p-3 rounded-xl bg-brand/10">
                  <CatIcon className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{form.name || 'Nom non défini'}</p>
                  <p className="text-sm text-gray-500">{CATEGORIES.find((c) => c.value === form.category)?.label} • {COLLAB_LEVELS.find((c) => c.value === form.collaborationLevel)?.label}</p>
                </div>
              </div>
              {form.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" /> {form.email}
                </div>
              )}
              {form.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" /> {form.phone}
                </div>
              )}
              {form.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 md:col-span-2">
                  <MapPin className="h-4 w-4" /> {form.address}, {form.city} {form.country}
                </div>
              )}
              {form.specialite && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Spécialité</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{form.specialite}</p>
                </div>
              )}
              {form.description && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{form.description}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1.5" />
            {step > 1 ? 'Étape précédente' : 'Annuler'}
          </Button>
          <Button type="submit" disabled={createPartner.isPending}>
            {step < 6 ? (
              <>Suivant <ChevronRight className="h-4 w-4 ml-1.5" /></>
            ) : (
              <><Save className="h-4 w-4 mr-1.5" /> {createPartner.isPending ? 'Enregistrement...' : 'Enregistrer le partenaire'}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
