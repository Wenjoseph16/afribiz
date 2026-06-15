'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, Utensils, DollarSign, Clock, Ruler, Tag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useMenuCategories, useCreateMenuItem } from '@/features/hooks';
import { useNotifyError } from '@/hooks/useNotifyError';

const MENU_TYPES = ['BREAKFAST','LUNCH','DINNER','SNACK','DESSERT','DRINK','COCKTAIL','SPECIAL','EVENT'];
const STATUSES = ['AVAILABLE','OUT_OF_STOCK','DISABLED','PROMO'];
const ALLERGENS = ['Arachides','Gluten','Lactose','Œufs','Soja','Fruits de mer','Sésame','Moutarde'];
const VARIANT_TYPES = ['SIZE','PORTION','FLAVOR','SPICE_LEVEL','SUPPLEMENT'];

export default function NewMenuItemPage() {
  const router = useRouter();
  const { data: catsData } = useMenuCategories();
  const createMenuItem = useCreateMenuItem();
  const categories = Array.isArray(catsData) ? catsData : (catsData?.items || catsData?.data || []);

  const notifyError = useNotifyError();

  const [form, setForm] = useState<any>({
    name: '', shortDescription: '', description: '',
    type: 'LUNCH', categoryId: '',
    price: '', currency: 'FCFA', status: 'AVAILABLE',
    prepTime: '', cookTime: '', calories: '', sortOrder: 0,
    isPopular: false, isStar: false, featured: false,
    isActive: true, seoTitle: '', seoDescription: '',
    tags: '',
  });
  const [showPromo, setShowPromo] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  const update = (f: string, v: any) => setForm((p: any) => ({ ...p, [f]: v }));
  const toggleAllergen = (a: string) => {
    setSelectedAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { name: '', type: 'SIZE', price: 0, currency: 'FCFA', isAvailable: true }]);
  };
  const updateVariant = (idx: number, field: string, value: any) => {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };
  const removeVariant = (idx: number) => {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMenuItem.mutateAsync({
        name: form.name,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        type: form.type,
        categoryId: form.categoryId || undefined,
        price: Number(form.price),
        currency: form.currency,
        status: form.status,
        prepTime: form.prepTime ? Number(form.prepTime) : null,
        cookTime: form.cookTime ? Number(form.cookTime) : null,
        calories: form.calories ? Number(form.calories) : null,
        sortOrder: Number(form.sortOrder || 0),
        isPromotional: showPromo,
        promotionalPrice: showPromo && form.promotionalPrice ? Number(form.promotionalPrice) : undefined,
        discountPercent: showPromo ? Number(form.discountPercent || 0) : 0,
        promotionEndsAt: showPromo && form.promotionEndsAt ? form.promotionEndsAt : undefined,
        isPopular: form.isPopular,
        isStar: form.isStar,
        featured: form.featured,
        isActive: form.isActive,
        allergens: selectedAllergens,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        hasVariants: variants.length > 0,
        variants: variants.map((v: any) => ({
          name: v.name,
          type: v.type || 'SIZE',
          price: Number(v.price),
          currency: v.currency || 'FCFA',
          isAvailable: v.isAvailable !== false,
        })),
      });
      router.push('/dashboard/menu');
    } catch (err) {
      notifyError(err, 'Erreur', "Impossible de créer le plat");
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau plat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ajoutez un plat ou une boisson à votre menu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Utensils className="w-4 h-4 text-brand" /> Informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du plat *</label>
                <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex: Poulet Braisé, Riz Sauté..." required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description courte</label>
                <textarea value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} maxLength={200} placeholder="Courte description..." />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description complète</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={4} placeholder="Ingrédients, saveurs, origine..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select value={form.type} onChange={(e) => update('type', e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                  {MENU_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                  <option value="">Sans catégorie</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* Tarification */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand" /> Tarification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Prix *" type="number" min={0} value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="6500" required />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise</label>
                <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                  <option>FCFA</option><option>EUR</option><option>USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                <select value={form.status} onChange={(e) => update('status', e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="pt-2">
              <button type="button" onClick={() => setShowPromo(!showPromo)} className="text-sm text-brand hover:text-brand-700 font-medium flex items-center gap-1">
                <span className="text-lg leading-none">+</span> Ajouter une promotion
              </button>
              {showPromo && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
                  <Input label="Prix promo" type="number" value={form.promotionalPrice || ''} onChange={e => update('promotionalPrice', e.target.value)} placeholder="5500" />
                  <Input label="Réduction %" type="number" min={0} max={100} value={form.discountPercent || ''} onChange={e => update('discountPercent', e.target.value)} placeholder="20" />
                  <Input label="Fin de promo" type="date" value={form.promotionEndsAt || ''} onChange={e => update('promotionEndsAt', e.target.value)} />
                </div>
              )}
            </div>
          </Card>

          {/* Temps & nutrition */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Clock className="w-4 h-4 text-brand" /> Préparation & Nutrition</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label="Préparation (min)" type="number" min={0} value={form.prepTime} onChange={e => update('prepTime', e.target.value)} placeholder="15" />
              <Input label="Cuisson (min)" type="number" min={0} value={form.cookTime} onChange={e => update('cookTime', e.target.value)} placeholder="25" />
              <Input label="Calories (kcal)" type="number" min={0} value={form.calories} onChange={e => update('calories', e.target.value)} placeholder="450" />
              <Input label="Ordre" type="number" min={0} value={form.sortOrder} onChange={e => update('sortOrder', e.target.value)} placeholder="0" />
            </div>
          </Card>

          {/* Allergènes */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Ruler className="w-4 h-4 text-brand" /> Allergènes</h2>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => (
                <button key={a} type="button" onClick={() => toggleAllergen(a)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    selectedAllergens.includes(a) ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}>
                  {a}
                </button>
              ))}
            </div>
          </Card>

          {/* Variantes */}
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Tag className="w-4 h-4 text-brand" /> Variantes</h2>
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Nom</label>
                    <input value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" placeholder="Ex: Grande, Épicé..." />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-medium mb-1">Type</label>
                    <select value={v.type} onChange={e => updateVariant(idx, 'type', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent">
                      {VARIANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium mb-1">Prix</label>
                    <input type="number" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs pb-2">
                    <input type="checkbox" checked={v.isAvailable} onChange={e => updateVariant(idx, 'isAvailable', e.target.checked)} className="rounded" /> Dispo
                  </label>
                  <button type="button" onClick={() => removeVariant(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">✕</button>
                </div>
              ))}
              <button type="button" onClick={addVariant} className="text-sm text-brand font-medium flex items-center gap-1">
                <span className="text-lg leading-none">+</span> Ajouter une variante
              </button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Visibilité</h3>
            <div className="space-y-3">
              {[
                { label: 'Plat populaire', key: 'isPopular', desc: 'Afficher dans la section populaires' },
                { label: 'Plat star', key: 'isStar', desc: 'Mettre en avant sur la page publique' },
                { label: 'À la une', key: 'featured', desc: 'Afficher en premier dans les listes' },
              ].map((opt) => (
                <label key={opt.key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={(form as any)[opt.key]} onChange={() => update(opt.key, !(form as any)[opt.key])} className="mt-0.5 rounded" />
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p><p className="text-xs text-gray-400">{opt.desc}</p></div>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Tags</h3>
            <Input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="Ex: épicé, végétarien, local" />
            <p className="text-xs text-gray-400">Séparés par des virgules</p>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Médias</h3>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-brand/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Ajoutez des photos du plat</p>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm"><Eye className="w-4 h-4 inline mr-1" /> SEO</h3>
            <Input label="Titre SEO" value={form.seoTitle} onChange={e => update('seoTitle', e.target.value)} placeholder="Titre pour Google" />
            <div>
              <label className="block text-sm font-medium mb-1">Description SEO</label>
              <textarea value={form.seoDescription} onChange={e => update('seoDescription', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent resize-none" rows={2} maxLength={160} placeholder="Meta description..." />
            </div>
          </Card>

          <Button type="submit" className="w-full" isLoading={createMenuItem.isPending}><Save className="w-4 h-4 mr-1.5" />Enregistrer</Button>
          <Link href="/dashboard/menu">
            <Button variant="secondary" className="w-full">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
