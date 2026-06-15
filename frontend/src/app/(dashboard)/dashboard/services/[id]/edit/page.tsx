'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Plus, X, Upload, Clock, MapPin, Users,
  Eye, Search, Tag, DollarSign, Image, Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useMyService, useUpdateService, useServiceCategories } from '@/features/hooks';
import { cn } from '@/lib/utils';

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: s, isLoading } = useMyService(id);
  const updateService = useUpdateService();
  const { data: catsData } = useServiceCategories();
  const categories = Array.isArray(catsData) ? catsData : (catsData?.items || catsData?.data || []);

  const [form, setForm] = useState<any>({
    name: '', shortDescription: '', description: '', categoryId: '',
    tags: [] as string[], images: [] as string[], video: '',
    price: '', priceType: 'FIXED', minPrice: '', currency: 'FCFA',
    isPromotional: false, promotionalPrice: '', discountPercent: 0, promotionEndsAt: '',
    duration: '', durationMin: '', durationMax: '',
    availability: 'ALWAYS', bookingRequired: true, depositRequired: false,
    depositAmount: '', autoConfirm: false, locationType: 'ON_SITE',
    isVisibleOnPublicPage: true, isVisibleOnMarketplace: true,
    seoTitle: '', seoDescription: '',
    employees: [] as { name: string; title: string }[],
  });
  const [tagInput, setTagInput] = useState('');
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    if (s) {
      setForm({
        name: s.name || '',
        shortDescription: s.shortDescription || '',
        description: s.description || '',
        categoryId: s.categoryId || '',
        tags: s.tags || [],
        images: s.images || [],
        video: s.video || '',
        price: s.price?.toString() || '',
        priceType: s.priceType || 'FIXED',
        minPrice: s.minPrice?.toString() || '',
        currency: s.currency || 'FCFA',
        isPromotional: s.isPromotional || false,
        promotionalPrice: s.promotionalPrice?.toString() || '',
        discountPercent: s.discountPercent || 0,
        promotionEndsAt: s.promotionEndsAt ? s.promotionEndsAt.split('T')[0] : '',
        duration: s.duration?.toString() || '',
        durationMin: s.durationMin?.toString() || '',
        durationMax: s.durationMax?.toString() || '',
        availability: s.availability || 'ALWAYS',
        bookingRequired: s.bookingRequired ?? true,
        depositRequired: s.depositRequired || false,
        depositAmount: s.depositAmount?.toString() || '',
        autoConfirm: s.autoConfirm || false,
        locationType: s.locationType || 'ON_SITE',
        isVisibleOnPublicPage: s.isVisibleOnPublicPage ?? true,
        isVisibleOnMarketplace: s.isVisibleOnMarketplace ?? true,
        seoTitle: s.seoTitle || '',
        seoDescription: s.seoDescription || '',
        employees: (s.employees || []).map((e: any) => ({ name: e.name, title: e.title || '' })),
      });
      setShowPromo(s.isPromotional || false);
    }
  }, [s]);

  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { update('tags', [...form.tags, t]); setTagInput(''); }
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
        price: form.price ? Number(form.price) : null,
        priceType: form.priceType,
        minPrice: form.minPrice ? Number(form.minPrice) : null,
        isPromotional: form.isPromotional,
        promotionalPrice: form.isPromotional && form.promotionalPrice ? Number(form.promotionalPrice) : null,
        discountPercent: form.isPromotional ? Number(form.discountPercent) : 0,
        promotionEndsAt: form.isPromotional && form.promotionEndsAt ? form.promotionEndsAt : null,
        duration: form.duration ? Number(form.duration) : null,
        durationMin: form.durationMin ? Number(form.durationMin) : null,
        durationMax: form.durationMax ? Number(form.durationMax) : null,
        availability: form.availability,
        bookingRequired: form.bookingRequired,
        depositRequired: form.depositRequired,
        depositAmount: form.depositRequired && form.depositAmount ? Number(form.depositAmount) : null,
        autoConfirm: form.autoConfirm,
        locationType: form.locationType,
        isVisibleOnPublicPage: form.isVisibleOnPublicPage,
        isVisibleOnMarketplace: form.isVisibleOnMarketplace,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        employees: form.employees.filter((e: any) => e.name.trim()).map((e: any) => ({ name: e.name.trim(), title: e.title.trim() })),
      };
      if (payload.isPromotional && payload.price && payload.promotionalPrice && !payload.discountPercent) {
        payload.discountPercent = Math.round((1 - payload.promotionalPrice / payload.price) * 100);
      }
      await updateService.mutateAsync({ id, data: payload });
      router.push(`/dashboard/services/${id}`);
    } catch (err) {
      // handled by hook
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/services/${id}`} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Modifier le service</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s?.name}</p></div>
        </div>
        <Link href={`/dashboard/services/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === INFORMATIONS PRINCIPALES === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Search className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Informations principales</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Input label="Nom du service *" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium mb-2">Description courte</label><textarea value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)} className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} maxLength={200} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium mb-2">Description complète</label><textarea value={form.description} onChange={e => update('description', e.target.value)} className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={4} /></div>
            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)} className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="">Sélectionner...</option>
                {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" placeholder="Ajouter" />
                <button type="button" onClick={addTag} className="px-3 py-2 rounded-xl bg-brand/10 text-brand text-sm font-medium hover:bg-brand/20">+</button>
              </div>
              {form.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{form.tags.map((t: string) => <span key={t} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">#{t}<button type="button" onClick={() => removeTag(t)} className="hover:text-red-500"><X className="h-3 w-3" /></button></span>)}</div>}
            </div>
          </div>
        </Card>

        {/* === MÉDIAS === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Image className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Médias</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-brand/40 transition-colors"><Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500 dark:text-gray-400">Image principale</p><Button variant="outline" size="sm" className="mt-3" type="button">Modifier</Button></div>
            <Input label="URL vidéo (YouTube/Vimeo)" value={form.video} onChange={e => update('video', e.target.value)} placeholder="https://..." />
          </div>
        </Card>

        {/* === TARIFICATION === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tarification</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select value={form.priceType} onChange={e => update('priceType', e.target.value)} className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="FIXED">Fixe</option><option value="VARIABLE">Variable</option><option value="FROM">À partir de</option>
              </select>
            </div>
            <Input label="Prix" type="number" value={form.price} onChange={e => update('price', e.target.value)} />
            <Input label="Devise" value="FCFA" disabled />
            {(form.priceType === 'VARIABLE' || form.priceType === 'FROM') && <Input label="Prix minimum" type="number" value={form.minPrice} onChange={e => update('minPrice', e.target.value)} />}
          </div>
          <div className="mt-4">
            <button type="button" onClick={() => { setShowPromo(!showPromo); update('isPromotional', !showPromo); }} className={cn('text-sm font-medium', showPromo ? 'text-red-500' : 'text-brand')}>{showPromo ? '— Masquer' : '+ Promo'}</button>
            {showPromo && <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100"><Input label="Prix promo" type="number" value={form.promotionalPrice} onChange={e => update('promotionalPrice', e.target.value)} /><Input label="Réduction %" type="number" value={form.discountPercent} onChange={e => update('discountPercent', Number(e.target.value))} /><Input label="Fin" type="date" value={form.promotionEndsAt} onChange={e => update('promotionEndsAt', e.target.value)} /></div>}
          </div>
        </Card>

        {/* === DURÉE === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Clock className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Durée</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Input label="Estimée (min)" type="number" value={form.duration} onChange={e => update('duration', e.target.value)} /><Input label="Min (min)" type="number" value={form.durationMin} onChange={e => update('durationMin', e.target.value)} /><Input label="Max (min)" type="number" value={form.durationMax} onChange={e => update('durationMax', e.target.value)} /></div>
        </Card>

        {/* === DISPONIBILITÉ === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><MapPin className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Disponibilité & Lieu</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Disponibilité</label>
              <select value={form.availability} onChange={e => update('availability', e.target.value)} className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="ALWAYS">Tous les jours</option><option value="CUSTOM">Personnalisé</option><option value="APPOINTMENT_ONLY">Sur rendez-vous</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lieu</label>
              <select value={form.locationType} onChange={e => update('locationType', e.target.value)} className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="ON_SITE">Sur place</option><option value="AT_HOME">À domicile</option><option value="ONLINE">En ligne</option><option value="HYBRID">Hybride</option>
              </select>
            </div>
          </div>
        </Card>

        {/* === RÉSERVATION === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Tag className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Réservation</h3></div>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer"><input type="checkbox" checked={form.bookingRequired} onChange={e => update('bookingRequired', e.target.checked)} className="mt-0.5 rounded border-gray-300 text-brand focus:ring-brand" /><div><p className="text-sm font-medium">Réservation obligatoire</p></div></label>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer"><input type="checkbox" checked={form.autoConfirm} onChange={e => update('autoConfirm', e.target.checked)} className="mt-0.5 rounded border-gray-300 text-brand focus:ring-brand" /><div><p className="text-sm font-medium">Confirmation automatique</p></div></label>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer"><input type="checkbox" checked={form.depositRequired} onChange={e => update('depositRequired', e.target.checked)} className="mt-0.5 rounded border-gray-300 text-brand focus:ring-brand" /><div><p className="text-sm font-medium">Acompte obligatoire</p></div></label>
            {form.depositRequired && <div className="ml-8"><Input label="Montant" type="number" value={form.depositAmount} onChange={e => update('depositAmount', e.target.value)} /></div>}
          </div>
        </Card>

        {/* === EMPLOYÉS === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Users className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Employés</h3></div>
          {form.employees.map((emp: any, i: number) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-2">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={emp.name} onChange={e => updateEmployee(i, 'name', e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Nom" />
                <input value={emp.title} onChange={e => updateEmployee(i, 'title', e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Titre" />
              </div>
              <button type="button" onClick={() => removeEmployee(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={addEmployee} className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 hover:border-brand/30 hover:text-brand transition-all"><Plus className="h-4 w-4 inline mr-1" />Employé</button>
        </Card>

        {/* === VISIBILITÉ === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Eye className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Visibilité</h3></div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer"><input type="checkbox" checked={form.isVisibleOnPublicPage} onChange={e => update('isVisibleOnPublicPage', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /><span className="text-sm font-medium">Afficher page publique</span></label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer"><input type="checkbox" checked={form.isVisibleOnMarketplace} onChange={e => update('isVisibleOnMarketplace', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /><span className="text-sm font-medium">Afficher marketplace</span></label>
          </div>
        </Card>

        {/* === SEO === */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Search className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">SEO</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Input label="Titre SEO" value={form.seoTitle} onChange={e => update('seoTitle', e.target.value)} placeholder="Titre pour les moteurs de recherche" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium mb-2">Description SEO</label><textarea value={form.seoDescription} onChange={e => update('seoDescription', e.target.value)} className="w-full px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} maxLength={160} /></div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href={`/dashboard/services/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
          <Button type="submit" isLoading={updateService.isPending}><Save className="h-4 w-4 mr-1.5" />Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
