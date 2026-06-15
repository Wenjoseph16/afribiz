'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Upload, Plus, X, Clock, MapPin, Users,
  Eye, Search, Tag, DollarSign, Image,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useCreateService, useServiceCategories } from '@/features/hooks';
import { useNotifyError } from '@/hooks/useNotifyError';
import { cn } from '@/lib/utils';

export default function NewServicePage() {
  const router = useRouter();
  const createService = useCreateService();
  const { data: catsData } = useServiceCategories();

  const categories = Array.isArray(catsData) ? catsData : (catsData?.items || catsData?.data || []);

  const [form, setForm] = useState<any>({
    name: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    tags: [] as string[],
    images: [] as string[],
    video: '',
    price: '',
    priceType: 'FIXED',
    minPrice: '',
    currency: 'FCFA',
    isPromotional: false,
    promotionalPrice: '',
    discountPercent: 0,
    promotionEndsAt: '',
    duration: '',
    durationMin: '',
    durationMax: '',
    availability: 'ALWAYS',
    bookingRequired: true,
    depositRequired: false,
    depositAmount: '',
    autoConfirm: false,
    locationType: 'ON_SITE',
    isVisibleOnPublicPage: true,
    isVisibleOnMarketplace: true,
    seoTitle: '',
    seoDescription: '',
    employees: [] as { name: string; title: string }[],
  });

  const [tagInput, setTagInput] = useState('');
  const [showPromo, setShowPromo] = useState(false);
  const notifyError = useNotifyError();

  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      update('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => update('tags', form.tags.filter((x: string) => x !== t));

  const addEmployee = () => update('employees', [...form.employees, { name: '', title: '' }]);
  const removeEmployee = (i: number) => update('employees', form.employees.filter((_: any, idx: number) => idx !== i));
  const updateEmployee = (i: number, field: string, value: string) => {
    const updated = [...form.employees];
    updated[i] = { ...updated[i], [field]: value };
    update('employees', updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        categoryId: form.categoryId || undefined,
        tags: form.tags,
        images: form.images,
        video: form.video || undefined,
        price: form.price ? Number(form.price) : undefined,
        priceType: form.priceType,
        minPrice: form.minPrice ? Number(form.minPrice) : undefined,
        isPromotional: form.isPromotional,
        promotionalPrice: form.isPromotional && form.promotionalPrice ? Number(form.promotionalPrice) : undefined,
        discountPercent: form.isPromotional ? Number(form.discountPercent) : 0,
        promotionEndsAt: form.isPromotional && form.promotionEndsAt ? form.promotionEndsAt : undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        durationMin: form.durationMin ? Number(form.durationMin) : undefined,
        durationMax: form.durationMax ? Number(form.durationMax) : undefined,
        availability: form.availability,
        bookingRequired: form.bookingRequired,
        depositRequired: form.depositRequired,
        depositAmount: form.depositRequired && form.depositAmount ? Number(form.depositAmount) : undefined,
        autoConfirm: form.autoConfirm,
        locationType: form.locationType,
        isVisibleOnPublicPage: form.isVisibleOnPublicPage,
        isVisibleOnMarketplace: form.isVisibleOnMarketplace,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        employees: form.employees.filter((e: any) => e.name.trim()).map((e: any) => ({ name: e.name.trim(), title: e.title.trim() })),
      };
      // Auto-calculate discount percent if promo price set
      if (payload.isPromotional && payload.price && payload.promotionalPrice && !payload.discountPercent) {
        payload.discountPercent = Math.round((1 - payload.promotionalPrice / payload.price) * 100);
      }
      await createService.mutateAsync(payload);
      router.push('/dashboard/services');
    } catch (err) {
      notifyError(err, 'Erreur', "Impossible de créer le service");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/services" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Nouveau service</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ajoutez une prestation à votre catalogue</p>
          </div>
        </div>
        <Link href="/dashboard/services">
          <Button variant="outline" type="button">Annuler</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === INFORMATIONS PRINCIPALES === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Search className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Informations principales</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Nom du service *" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Coupe homme, Massage relaxant..." required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description courte</label>
              <textarea value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100"
                rows={2} maxLength={200} placeholder="Brève description (200 caractères max)" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description complète</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100"
                rows={4} placeholder="Décrivez votre service en détail..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="">Sélectionner...</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
                  placeholder="Ajouter un tag" />
                <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20 transition-colors">+</button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t: string) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* === MÉDIAS === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Image className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Médias</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-brand/40 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Image principale</p>
              <Button variant="outline" size="sm" className="mt-3" type="button">Parcourir</Button>
            </div>
            <div className="space-y-3">
              <Input label="URL vidéo (YouTube/Vimeo)" value={form.video} onChange={e => update('video', e.target.value)} placeholder="https://..." />
              <p className="text-xs text-gray-400">Ajoutez une vidéo de présentation</p>
            </div>
          </div>
        </Card>

        {/* === TARIFICATION === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tarification</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de prix</label>
              <select value={form.priceType} onChange={e => update('priceType', e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="FIXED">Prix fixe</option>
                <option value="VARIABLE">Prix variable</option>
                <option value="FROM">À partir de</option>
              </select>
            </div>
            <Input label="Prix" type="number" min={0} value={form.price} onChange={e => update('price', e.target.value)} placeholder="5000" />
            <Input label="Devise" value="FCFA" disabled />
            {(form.priceType === 'VARIABLE' || form.priceType === 'FROM') && (
              <Input label="Prix minimum" type="number" min={0} value={form.minPrice} onChange={e => update('minPrice', e.target.value)} placeholder="3000" />
            )}
          </div>
          <div className="mt-4">
            <button type="button" onClick={() => { setShowPromo(!showPromo); if (!showPromo) update('isPromotional', true); else update('isPromotional', false); }}
              className={cn('text-sm font-medium transition-colors', showPromo ? 'text-red-500' : 'text-brand')}>
              {showPromo ? '— Masquer la promotion' : '+ Ajouter une promotion'}
            </button>
            {showPromo && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                <Input label="Prix promo" type="number" min={0} value={form.promotionalPrice} onChange={e => update('promotionalPrice', e.target.value)} placeholder="4000" />
                <Input label="Réduction (%)" type="number" min={0} max={100} value={form.discountPercent} onChange={e => update('discountPercent', Number(e.target.value))} placeholder="20" />
                <Input label="Fin de promo" type="date" value={form.promotionEndsAt} onChange={e => update('promotionEndsAt', e.target.value)} />
                {form.price && form.promotionalPrice && Number(form.promotionalPrice) < Number(form.price) && (
                  <div className="sm:col-span-3 text-xs text-green-600 bg-green-50 dark:bg-green-900/10 px-3 py-2 rounded-lg">
                    Prix barré : <span className="line-through text-gray-400">{Number(form.price).toLocaleString()} FCFA</span> → <span className="font-bold text-red-500">{Number(form.promotionalPrice).toLocaleString()} FCFA</span>
                    {!form.discountPercent && ` (${Math.round((1 - Number(form.promotionalPrice) / Number(form.price)) * 100)}% de réduction)`}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* === DURÉE === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Clock className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Durée</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Durée estimée (minutes)" type="number" min={0} value={form.duration} onChange={e => update('duration', e.target.value)} placeholder="60" />
            <Input label="Durée minimum (minutes)" type="number" min={0} value={form.durationMin} onChange={e => update('durationMin', e.target.value)} placeholder="30" />
            <Input label="Durée maximum (minutes)" type="number" min={0} value={form.durationMax} onChange={e => update('durationMax', e.target.value)} placeholder="120" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Ex: Coupe homme = 30min, Massage complet = 60min, Formation = plusieurs heures</p>
        </Card>

        {/* === DISPONIBILITÉ === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><MapPin className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Disponibilité</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Disponibilité</label>
              <select value={form.availability} onChange={e => update('availability', e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="ALWAYS">Tous les jours</option>
                <option value="CUSTOM">Horaires personnalisés</option>
                <option value="APPOINTMENT_ONLY">Sur rendez-vous uniquement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lieu de prestation</label>
              <select value={form.locationType} onChange={e => update('locationType', e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="ON_SITE">Sur place</option>
                <option value="AT_HOME">À domicile</option>
                <option value="ONLINE">En ligne</option>
                <option value="HYBRID">Hybride (sur place ou en ligne)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* === RÉSERVATION === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Tag className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Réservation</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 transition-colors cursor-pointer">
              <input type="checkbox" checked={form.bookingRequired} onChange={e => update('bookingRequired', e.target.checked)} className="mt-0.5 rounded border-gray-300 text-brand focus:ring-brand" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Réservation obligatoire</p><p className="text-xs text-gray-500">Le client doit réserver avant de venir</p></div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 transition-colors cursor-pointer">
              <input type="checkbox" checked={form.autoConfirm} onChange={e => update('autoConfirm', e.target.checked)} className="mt-0.5 rounded border-gray-300 text-brand focus:ring-brand" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Confirmation automatique</p><p className="text-xs text-gray-500">Les réservations sont confirmées automatiquement</p></div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 transition-colors cursor-pointer">
              <input type="checkbox" checked={form.depositRequired} onChange={e => update('depositRequired', e.target.checked)} className="mt-0.5 rounded border-gray-300 text-brand focus:ring-brand" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Acompte obligatoire</p><p className="text-xs text-gray-500">Le client paie un acompte pour réserver</p></div>
            </label>
            {form.depositRequired && (
              <div className="ml-8">
                <Input label="Montant de l'acompte" type="number" min={0} value={form.depositAmount} onChange={e => update('depositAmount', e.target.value)} placeholder="2000" />
              </div>
            )}
          </div>
        </Card>

        {/* === EMPLOYÉS === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Users className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Employés</h3>
          </div>
          <div className="space-y-2">
            {form.employees.map((emp: any, i: number) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={emp.name} onChange={e => updateEmployee(i, 'name', e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Nom de l'employé" />
                  <input value={emp.title} onChange={e => updateEmployee(i, 'title', e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Titre (ex: Coiffeur senior)" />
                </div>
                <button type="button" onClick={() => removeEmployee(i)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addEmployee}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-brand/30 hover:text-brand transition-all">
              <Plus className="h-4 w-4 inline mr-1" />Ajouter un employé
            </button>
          </div>
        </Card>

        {/* === VISIBILITÉ === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Eye className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Visibilité</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 transition-colors cursor-pointer">
              <input type="checkbox" checked={form.isVisibleOnPublicPage} onChange={e => update('isVisibleOnPublicPage', e.target.checked)}
                className="rounded border-gray-300 text-brand focus:ring-brand" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Afficher sur la page publique</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 transition-colors cursor-pointer">
              <input type="checkbox" checked={form.isVisibleOnMarketplace} onChange={e => update('isVisibleOnMarketplace', e.target.checked)}
                className="rounded border-gray-300 text-brand focus:ring-brand" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Afficher sur le marketplace</p></div>
            </label>
          </div>
        </Card>

        {/* === SEO === */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Search className="h-4 w-4 text-brand" /></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">SEO (Référencement)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Titre SEO (balise titre)" value={form.seoTitle} onChange={e => update('seoTitle', e.target.value)} placeholder="Ex: Coiffure homme professionnel - Mon Business" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description SEO (meta description)</label>
              <textarea value={form.seoDescription} onChange={e => update('seoDescription', e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100"
                rows={2} maxLength={160} placeholder="Courte description pour les moteurs de recherche (160 caractères max)" />
            </div>
          </div>
        </Card>

        {/* === SUBMIT === */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/dashboard/services"><Button variant="outline" type="button">Annuler</Button></Link>
          <Button type="submit" isLoading={createService.isPending} disabled={!form.name.trim()}>
            <Save className="h-4 w-4 mr-1.5" />Enregistrer le service
          </Button>
        </div>
      </form>
    </div>
  );
}
