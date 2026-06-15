'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Upload, Utensils, DollarSign, Clock,
  Ruler, Flame, ChefHat, Tag, BadgePercent, Eye, Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useMyMenuItem, useUpdateMenuItem, useMenuCategories } from '@/features/hooks';

const MENU_TYPES = ['BREAKFAST','LUNCH','DINNER','SNACK','DESSERT','DRINK','COCKTAIL','SPECIAL','EVENT'];
const STATUSES = ['AVAILABLE','OUT_OF_STOCK','DISABLED','PROMO'];
const ALLERGENS = ['Arachides','Gluten','Lactose','Œufs','Soja','Fruits de mer','Sésame','Moutarde'];
const VARIANT_TYPES = ['SIZE','PORTION','FLAVOR','SPICE_LEVEL','SUPPLEMENT'];

export default function EditMenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: item, isLoading: loadingItem } = useMyMenuItem(id);
  const { data: catsData } = useMenuCategories();
  const updateMenuItem = useUpdateMenuItem();
  const categories = Array.isArray(catsData) ? catsData : (catsData?.items || catsData?.data || []);

  const [saving, setSaving] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (item) {
      setForm(item);
      setSelectedAllergens(item.allergens || []);
      setShowPromo(item.isPromotional || false);
      setVariants(item.variants || []);
    }
  }, [item]);

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
    setSaving(true);
    try {
      await updateMenuItem.mutateAsync({
        id,
        data: {
          name: form.name,
          shortDescription: form.shortDescription || undefined,
          description: form.description || undefined,
          type: form.type || 'LUNCH',
          categoryId: form.categoryId || undefined,
          price: Number(form.price),
          currency: form.currency || 'FCFA',
          images: form.images || [],
          video: form.video || undefined,
          tags: form.tags || [],
          allergens: selectedAllergens,
          prepTime: form.prepTime ? Number(form.prepTime) : null,
          cookTime: form.cookTime ? Number(form.cookTime) : null,
          calories: form.calories ? Number(form.calories) : null,
          isPromotional: showPromo,
          promotionalPrice: showPromo && form.promotionalPrice ? Number(form.promotionalPrice) : undefined,
          discountPercent: showPromo ? Number(form.discountPercent || 0) : 0,
          promotionEndsAt: showPromo && form.promotionEndsAt ? form.promotionEndsAt : undefined,
          status: form.status || 'AVAILABLE',
          isPopular: form.isPopular || false,
          isStar: form.isStar || false,
          featured: form.featured || false,
          sortOrder: Number(form.sortOrder || 0),
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
        },
      });
      router.push(`/dashboard/menu/${id}`);
    } catch (err) {
      setSaving(false);
    }
  };

  if (loadingItem) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/menu/${id}`} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div><h1 className="text-xl sm:text-2xl font-bold">Modifier le plat</h1><p className="text-sm text-gray-500 mt-0.5">{item?.name}</p></div>
        </div>
        <Link href={`/dashboard/menu/${id}`}><Button variant="outline">Annuler</Button></Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos principales */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Utensils className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Informations générales</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Input label="Nom du plat *" value={form.name || ''} onChange={e => update('name', e.target.value)} required /></div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description courte</label>
              <textarea value={form.shortDescription || ''} onChange={e => update('shortDescription', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} maxLength={200} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description complète</label>
              <textarea value={form.description || ''} onChange={e => update('description', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={4} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select value={form.type || 'LUNCH'} onChange={e => update('type', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                {MENU_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select value={form.categoryId || ''} onChange={e => update('categoryId', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option value="">Sans catégorie</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Tarification */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><DollarSign className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Tarification</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Prix *" type="number" value={form.price?.toString() || ''} onChange={e => update('price', e.target.value)} required />
            <div>
              <label className="block text-sm font-medium mb-2">Devise</label>
              <select value={form.currency || 'FCFA'} onChange={e => update('currency', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                <option>FCFA</option><option>EUR</option><option>USD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select value={form.status || 'AVAILABLE'} onChange={e => update('status', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button type="button" onClick={() => setShowPromo(!showPromo)} className={cn('text-sm font-medium', showPromo ? 'text-red-500' : 'text-brand')}>{showPromo ? '— Masquer promo' : '+ Ajouter une promotion'}</button>
            {showPromo && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/30">
                <Input label="Prix promo" type="number" value={form.promotionalPrice?.toString() || ''} onChange={e => update('promotionalPrice', e.target.value)} />
                <Input label="Réduction %" type="number" min={0} max={100} value={form.discountPercent || 0} onChange={e => update('discountPercent', Number(e.target.value))} />
                <Input label="Fin de promo" type="date" value={form.promotionEndsAt || ''} onChange={e => update('promotionEndsAt', e.target.value)} />
              </div>
            )}
          </div>
        </Card>

        {/* Temps & calories */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Clock className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Préparation & Nutrition</h3></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input label="Temps prép. (min)" type="number" min={0} value={form.prepTime?.toString() || ''} onChange={e => update('prepTime', e.target.value)} />
            <Input label="Cuisson (min)" type="number" min={0} value={form.cookTime?.toString() || ''} onChange={e => update('cookTime', e.target.value)} />
            <Input label="Calories (kcal)" type="number" min={0} value={form.calories?.toString() || ''} onChange={e => update('calories', e.target.value)} />
            <Input label="Ordre" type="number" min={0} value={form.sortOrder?.toString() || '0'} onChange={e => update('sortOrder', e.target.value)} />
          </div>
        </Card>

        {/* Allergènes */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Ruler className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Allergènes</h3></div>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map(a => (
              <button key={a} type="button" onClick={() => toggleAllergen(a)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  selectedAllergens.includes(a) ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                )}>
                {a}
              </button>
            ))}
          </div>
        </Card>

        {/* Variantes */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Tag className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Variantes</h3></div>
          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Nom</label>
                  <input value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" placeholder="Ex: Grande, Moyenne" />
                </div>
                <div className="w-28">
                  <label className="block text-xs font-medium mb-1">Type</label>
                  <select value={v.type || 'SIZE'} onChange={e => updateVariant(idx, 'type', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent">
                    {VARIANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium mb-1">Prix</label>
                  <input type="number" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent" />
                </div>
                <label className="flex items-center gap-1.5 text-xs pb-2">
                  <input type="checkbox" checked={v.isAvailable !== false} onChange={e => updateVariant(idx, 'isAvailable', e.target.checked)} className="rounded" />
                  Dispo
                </label>
                <button type="button" onClick={() => removeVariant(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={addVariant} className="text-sm text-brand font-medium flex items-center gap-1">
              <span className="text-lg leading-none">+</span> Ajouter une variante
            </button>
          </div>
        </Card>

        {/* Médias */}
        <Card>
          <h3 className="text-sm font-semibold mb-4"><Upload className="h-4 w-4 inline mr-1.5" />Médias</h3>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-brand/40 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500">Photos du plat</p>
            <Button variant="outline" size="sm" className="mt-3" type="button">Modifier</Button>
          </div>
        </Card>

        {/* Visibilité & SEO */}
        <Card>
          <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Eye className="h-4 w-4 text-brand" /></div><h3 className="text-sm font-semibold">Visibilité & SEO</h3></div>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive !== false} onChange={e => update('isActive', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> Actif</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPopular || false} onChange={e => update('isPopular', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> Populaire</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isStar || false} onChange={e => update('isStar', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> Star</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured || false} onChange={e => update('featured', e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" /> À la une</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Titre SEO" value={form.seoTitle || ''} onChange={e => update('seoTitle', e.target.value)} />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Description SEO</label>
              <textarea value={form.seoDescription || ''} onChange={e => update('seoDescription', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none bg-transparent dark:text-gray-100" rows={2} maxLength={160} />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href={`/dashboard/menu/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
          <Button type="submit" isLoading={saving}><Save className="h-4 w-4 mr-1.5" />Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}
