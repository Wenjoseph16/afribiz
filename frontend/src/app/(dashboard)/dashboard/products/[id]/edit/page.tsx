'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Upload, Plus, X, Image,
  Package, Tag, DollarSign, Box, Truck, Eye, Search, Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useMyProduct, useUpdateProduct, useProductCategories } from '@/features/hooks';

interface Variant {
  key: string;
  name: string;
  sku: string;
  price: string;
  stock: string;
  id?: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: product, isLoading } = useMyProduct(id);
  const updateProduct = useUpdateProduct();
  const { data: catsData } = useProductCategories();

  // Main info
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  const tags = useMemo(() => tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean), [tagsStr]);

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState('');

  // Pricing
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('FCFA');
  const [isPromotional, setIsPromotional] = useState(false);
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  const autoDiscount = useMemo(() => {
    const p = Number(price);
    const pp = Number(promotionalPrice);
    if (p > 0 && pp > 0 && pp < p) return Math.round((1 - pp / p) * 100);
    return Number(discountPercent) || 0;
  }, [price, promotionalPrice, discountPercent]);

  // Stock
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [unit, setUnit] = useState('piece');
  const [availability, setAvailability] = useState<'in_stock' | 'out_of_stock' | 'pre_order'>('in_stock');

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const nextVariantKey = useRef(100);

  // Delivery
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [isPhysical, setIsPhysical] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState('');

  // Visibility
  const [isVisibleOnPublicPage, setIsVisibleOnPublicPage] = useState(true);
  const [isVisibleOnMarketplace, setIsVisibleOnMarketplace] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [saving, setSaving] = useState(false);

  // Load product data
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setShortDescription(product.shortDescription || '');
      setDescription(product.description || '');
      setCategoryId(product.categoryId || '');
      setBrand(product.brand || '');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setTagsStr((product.tags || []).join(', '));
      setImages(product.images || []);
      setVideo(product.video || '');
      setPrice(product.price?.toString() || '');
      setCurrency(product.currency || 'FCFA');
      setIsPromotional(product.isPromotional || false);
      setPromotionalPrice(product.promotionalPrice?.toString() || '');
      setDiscountPercent(product.discountPercent?.toString() || '');
      setStock(product.stock?.toString() || '');
      setLowStockThreshold(product.lowStockThreshold?.toString() || '5');
      setUnit(product.unit || 'piece');
      setAvailability(product.stock === 0 ? 'out_of_stock' : product.isOnPreOrder ? 'pre_order' : 'in_stock');
      setHasVariants(product.hasVariants || false);
      setVariants((product.variants || []).map((v: any) => ({
        key: `v${nextVariantKey.current++}`,
        id: v.id,
        name: v.name || '',
        sku: v.sku || '',
        price: v.price?.toString() || '',
        stock: v.stock?.toString() || '',
      })));
      setWeight(product.weight?.toString() || '');
      setDimensions(product.dimensions || '');
      setIsPhysical(product.isPhysical !== false);
      setDeliveryFee(product.deliveryFee?.toString() || '');
      setIsVisibleOnPublicPage(product.isVisibleOnPublicPage !== false);
      setIsVisibleOnMarketplace(product.isVisibleOnMarketplace !== false);
      setIsActive(product.isActive !== false);
      setSeoTitle(product.seoTitle || '');
      setSeoDescription(product.seoDescription || '');
    }
  }, [product]);

  const categories: any[] = Array.isArray(catsData) ? catsData : (catsData?.data || []);

  const addVariant = () => {
    setVariants(prev => [...prev, { key: `v${nextVariantKey.current++}`, name: '', sku: '', price: '', stock: '' }]);
  };

  const removeVariant = (key: string) => {
    setVariants(prev => prev.filter(v => v.key !== key));
  };

  const updateVariant = (key: string, field: keyof Variant, value: string) => {
    setVariants(prev => prev.map(v => v.key === key ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setSaving(true);

    try {
      const data: any = {
        name: name.trim(),
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        categoryId: categoryId || null,
        tags,
        price: Number(price),
        currency,
        images,
        video: video.trim() || undefined,
        stock: availability === 'out_of_stock' ? 0 : Number(stock) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        unit,
        isOnPreOrder: availability === 'pre_order',
        isPromotional,
        promotionalPrice: isPromotional && promotionalPrice ? Number(promotionalPrice) : undefined,
        discountPercent: autoDiscount || 0,
        weight: weight ? Number(weight) : undefined,
        dimensions: dimensions.trim() || undefined,
        isPhysical,
        deliveryFee: deliveryFee ? Number(deliveryFee) : undefined,
        isVisibleOnPublicPage,
        isVisibleOnMarketplace,
        isActive,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
      };

      if (hasVariants) {
        data.hasVariants = true;
        data.variants = variants
          .filter(v => v.name.trim())
          .map(v => ({
            id: v.id,
            name: v.name.trim(),
            sku: v.sku.trim() || undefined,
            price: v.price ? Number(v.price) : Number(price),
            stock: Number(v.stock) || 0,
          }));
      } else {
        data.hasVariants = false;
        data.variants = [];
      }

      await updateProduct.mutateAsync({ id, data });
      router.push(`/dashboard/products/${id}`);
    } catch {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  if (!product) {
    return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Produit introuvable</p></div>;
  }

  const isPending = saving || updateProduct.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/products/${id}`} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Modifier le produit</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{product?.name}</p>
          </div>
        </div>
        <Link href={`/dashboard/products/${id}`}>
          <Button variant="outline" type="button">Annuler</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* A — Informations principales */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Package className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Informations principales</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Nom du produit *" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description courte</label>
              <input value={shortDescription} onChange={e => setShortDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 outline-none transition-all"
                placeholder="Brève description" maxLength={150} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description complète</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 outline-none transition-all resize-none min-h-[100px]"
                rows={4} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Catégorie</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all">
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.icon || '📦'} {cat.name}</option>
                ))}
              </select>
            </div>
            <Input label="Marque" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex: Wax Africain" />
            <Input label="SKU / Référence" value={sku} onChange={e => setSku(e.target.value)} />
            <Input label="Code-barres" value={barcode} onChange={e => setBarcode(e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="Tags (séparés par des virgules)" value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="Ex: wax, africain, mode" />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* B — Médias */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Image className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Médias</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden group">
                  <div className="w-full h-full flex items-center justify-center text-gray-400">🖼️</div>
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setImages(prev => [...prev, `img-${Date.now()}`])}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand hover:text-brand transition-colors">
                <Upload className="h-5 w-5" />
                <span className="text-[10px] font-medium">Ajouter</span>
              </button>
            </div>
            <Input label="Vidéo produit (URL)" value={video} onChange={e => setVideo(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </div>
        </Card>

        {/* C — Prix */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Prix</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Prix normal *" type="number" min={0} step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Devise</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all">
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPromotional} onChange={e => setIsPromotional(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">En promotion</span>
              </label>
            </div>
          </div>
          {isPromotional && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Prix promotionnel" type="number" min={0} value={promotionalPrice} onChange={e => setPromotionalPrice(e.target.value)} />
                <Input label="Réduction (%)" type="number" min={0} max={100} value={discountPercent || autoDiscount.toString()} onChange={e => setDiscountPercent(e.target.value)} />
                {autoDiscount > 0 && (
                  <div className="flex items-center">
                    <div className="px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <p className="text-xs text-gray-500">Prix barré auto</p>
                      <p className="text-sm font-bold text-red-600">-{autoDiscount}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* D — Stock */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Box className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Stock</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Quantité disponible" type="number" min={0} value={stock} onChange={e => setStock(e.target.value)} disabled={availability === 'out_of_stock'} />
            <Input label="Stock minimum (alerte)" type="number" min={0} value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unité</label>
              <select value={unit} onChange={e => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all">
                <option value="piece">Pièce</option>
                <option value="kg">Kilogramme</option>
                <option value="g">Gramme</option>
                <option value="l">Litre</option>
                <option value="ml">Millilitre</option>
                <option value="m">Mètre</option>
                <option value="lot">Lot</option>
                <option value="service">Service</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all',
              availability === 'in_stock' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700')}>
              <input type="radio" name="edit-avail" checked={availability === 'in_stock'} onChange={() => setAvailability('in_stock')} className="text-emerald-500" />
              <span className="text-sm font-medium">En stock</span>
            </label>
            <label className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all',
              availability === 'out_of_stock' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700')}>
              <input type="radio" name="edit-avail" checked={availability === 'out_of_stock'} onChange={() => setAvailability('out_of_stock')} className="text-red-500" />
              <span className="text-sm font-medium">Rupture</span>
            </label>
            <label className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all',
              availability === 'pre_order' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700')}>
              <input type="radio" name="edit-avail" checked={availability === 'pre_order'} onChange={() => setAvailability('pre_order')} className="text-amber-500" />
              <span className="text-sm font-medium">Précommande</span>
            </label>
          </div>
        </Card>

        {/* E — Variantes */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Variantes</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={hasVariants} onChange={e => setHasVariants(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Activer les variantes</span>
            </label>
          </div>
          {hasVariants && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
                <div className="col-span-4">Nom</div>
                <div className="col-span-3">SKU</div>
                <div className="col-span-2 text-right">Prix</div>
                <div className="col-span-2 text-right">Stock</div>
                <div className="col-span-1"></div>
              </div>
              {variants.map((v) => (
                <div key={v.key} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <input value={v.name} onChange={e => updateVariant(v.key, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-brand outline-none"
                      placeholder="Ex: XL" />
                  </div>
                  <div className="col-span-3">
                    <input value={v.sku} onChange={e => updateVariant(v.key, 'sku', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-brand outline-none" />
                  </div>
                  <div className="col-span-2">
                    <input value={v.price} onChange={e => updateVariant(v.key, 'price', e.target.value)} type="number" min={0}
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-brand outline-none text-right" />
                  </div>
                  <div className="col-span-2">
                    <input value={v.stock} onChange={e => updateVariant(v.key, 'stock', e.target.value)} type="number" min={0}
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-brand outline-none text-right" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button type="button" onClick={() => removeVariant(v.key)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addVariant}
                className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-700 transition-colors">
                <Plus className="h-4 w-4" /> Ajouter une variante
              </button>
            </div>
          )}
        </Card>

        {/* F — Livraison */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Truck className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Livraison</h3>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPhysical} onChange={e => setIsPhysical(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Produit physique (livrable)</span>
            </label>
          </div>
          {isPhysical && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Poids (kg)" type="number" min={0} step="0.01" value={weight} onChange={e => setWeight(e.target.value)} />
              <Input label="Dimensions" value={dimensions} onChange={e => setDimensions(e.target.value)} placeholder="Ex: 30x20x10 cm" />
              <Input label="Frais de livraison" type="number" min={0} value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
            </div>
          )}
        </Card>

        {/* G — Visibilité */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Eye className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Visibilité</h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isVisibleOnPublicPage} onChange={e => setIsVisibleOnPublicPage(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Afficher sur la page publique</p></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isVisibleOnMarketplace} onChange={e => setIsVisibleOnMarketplace(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Afficher sur le marketplace</p></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Produit actif</p></div>
            </label>
          </div>
        </Card>

        {/* H — SEO */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Search className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">SEO</h3>
          </div>
          <div className="space-y-4">
            <Input label="Titre SEO" value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
              placeholder={name || 'Titre SEO'} maxLength={200} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description SEO</label>
              <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand outline-none transition-all resize-none"
                rows={2} maxLength={300} />
              <p className="text-xs text-gray-400 mt-1">{seoDescription.length || 0}/300</p>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 -mx-4 -mb-4 rounded-b-2xl border-t border-gray-100 dark:border-gray-800">
          <Link href={`/dashboard/products/${id}`}>
            <Button variant="outline" type="button">Annuler</Button>
          </Link>
          <Button type="submit" isLoading={isPending} disabled={!name.trim() || !price}>
            <Save className="h-4 w-4 mr-1.5" />Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
