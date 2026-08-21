'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  Save,
  Plus,
  X,
  Package,
  Tag,
  DollarSign,
  Box,
  Truck,
  Eye,
  Search,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useCreateProduct, useProductCategories } from '@/features/hooks';
import { useNotifyError } from '@/hooks/useNotifyError';
import { ImageDropzone, type DropImage } from '@/components/formkit/ImageDropzone';
import { MoneyInput } from '@/components/formkit/MoneyInput';
import { useAutoSave } from '@/components/formkit/useAutoSave';

interface Variant {
  key: string;
  name: string;
  sku: string;
  price: string;
  stock: string;
}

/** Convertit un dataUrl (image compressée du dropzone) en File prêt pour uploadMultipleMedia */
function dataUrlToFile(dataUrl: string, name: string): File {
  const [meta, b64] = dataUrl.split(',');
  const mime = meta.match(/data:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name || 'image.jpg', { type: mime });
}

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { data: catsData } = useProductCategories();

  // ── AutoSave : le gérant qui remplit 15 min ne perd jamais son brouillon ──
  const form = useAutoSave(
    'product:new:v1',
    {
      name: '',
      shortDescription: '',
      description: '',
      brand: '',
      sku: '',
      barcode: '',
      price: 0,
      priceOnDemand: false,
      stock: 0,
      weight: 0,
      deliveryFee: 0,
    },
    700
  );

  const [categoryId, setCategoryId] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [currency, setCurrency] = useState('FCFA');

  const tags = useMemo(
    () =>
      tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsStr]
  );

  // Media — vrai upload via ImageDropzone
  const [images, setImages] = useState<DropImage[]>([]);
  const [video, setVideo] = useState('');

  // Pricing
  const [isPromotional, setIsPromotional] = useState(false);
  const [promotionalPrice, setPromotionalPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState('');

  const autoDiscount = useMemo(() => {
    const p = Number(form.value.price);
    const pp = Number(promotionalPrice);
    if (p > 0 && pp > 0 && pp < p) return Math.round((1 - pp / p) * 100);
    return Number(discountPercent) || 0;
  }, [form.value.price, promotionalPrice, discountPercent]);

  // Stock
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [unit, setUnit] = useState('piece');
  const [availability, setAvailability] = useState<'in_stock' | 'out_of_stock' | 'pre_order'>(
    'in_stock'
  );

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([
    { key: 'v1', name: '', sku: '', price: '', stock: '' },
  ]);
  const nextVariantKey = useRef(2);

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { key: `v${nextVariantKey.current++}`, name: '', sku: '', price: '', stock: '' },
    ]);
  };

  const removeVariant = (key: string) => {
    setVariants((prev) => prev.filter((v) => v.key !== key));
  };

  const updateVariant = (key: string, field: keyof Variant, value: string) => {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)));
  };

  // Delivery
  const [dimensions, setDimensions] = useState('');
  const [isPhysical, setIsPhysical] = useState(true);

  // Épargne Achat — activée à la création (l'offre a besoin de l'id du produit)
  const [enableLayaway, setEnableLayaway] = useState(false);
  const [layawayDuration, setLayawayDuration] = useState('90');
  const [layawayMinInstallment, setLayawayMinInstallment] = useState(2000);

  // ── Étape C — Réglages avancés (rattachements : taxe, quantités, dispo, perso, cadeau, créneau, croisées) ──
  const [taxRate, setTaxRate] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [enableAvailability, setEnableAvailability] = useState(false);
  const [availDays, setAvailDays] = useState<number[]>([]);
  const [availOpen, setAvailOpen] = useState('08:00');
  const [availClose, setAvailClose] = useState('18:00');
  const [persoFields, setPersoFields] = useState<
    Array<{ key: string; label: string; price: string; required: boolean }>
  >([{ key: 'p1', label: '', price: '', required: false }]);
  const [giftWrapPrice, setGiftWrapPrice] = useState('');
  const [timeslotMinutes, setTimeslotMinutes] = useState('');
  const [crossSellIds, setCrossSellIds] = useState<string[]>([]);
  const [crossSellList, setCrossSellList] = useState<any[]>([]);
  const nextPersoKey = useRef(2);

  // ── Étape E — Réglages avancés 2027 : négociation, confiance, logistique, opérations ──
  const [allowNegotiation, setAllowNegotiation] = useState(false);
  const [customBadgeLabel, setCustomBadgeLabel] = useState('');
  const [customBadgeEmoji, setCustomBadgeEmoji] = useState('⭐');
  const [warrantyDays, setWarrantyDays] = useState('');
  const [warrantyConditions, setWarrantyConditions] = useState('');
  const [returnDays, setReturnDays] = useState('');
  const [returnConditions, setReturnConditions] = useState('');
  const [lotTracking, setLotTracking] = useState(false);
  const [lotExpiryDays, setLotExpiryDays] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [storePickupEnabled, setStorePickupEnabled] = useState(true);
  // Prix dégressifs par quantité (grossiste/épicier)
  const [tierRows, setTierRows] = useState<
    Array<{ key: string; minQuantity: string; percent: string }>
  >([]);
  const nextTierKey = useRef(1);
  // Fournisseur
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierCostPrice, setSupplierCostPrice] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [supplierSaving, setSupplierSaving] = useState(false);
  // Affiliation : chaque client devient un vendeur
  const [enableAffiliate, setEnableAffiliate] = useState(false);
  const [affiliatePercent, setAffiliatePercent] = useState('5');

  // Ventes croisées : liste des produits du business pour le multi-sélecteur
  useEffect(() => {
    apiClient
      .getMyProducts({ limit: 500 })
      .then((res: any) => {
        const list = res?.data?.data ?? [];
        setCrossSellList(Array.isArray(list) ? list : (list.items ?? []));
      })
      .catch(() => {});
    // Fournisseurs du business
    apiClient
      .getSuppliers()
      .then((res: any) => {
        const data = res?.data?.data ?? {};
        setSuppliersList(Array.isArray(data) ? data : (data.suppliers ?? []));
      })
      .catch(() => {});
  }, []);

  const addTierRow = () => {
    setTierRows((prev) => [
      ...prev,
      { key: `t${nextTierKey.current++}`, minQuantity: '', percent: '' },
    ]);
  };
  const updateTierRow = (key: string, field: 'minQuantity' | 'percent', value: string) => {
    setTierRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };
  const removeTierRow = (key: string) => {
    setTierRows((prev) => prev.filter((r) => r.key !== key));
  };

  const addSupplier = async () => {
    if (!newSupplierName.trim()) return;
    setSupplierSaving(true);
    try {
      const res = await apiClient.createSupplier({ name: newSupplierName.trim() });
      const created = res?.data?.data;
      if (created?.id) {
        setSuppliersList((prev) => [created, ...prev]);
        setSelectedSupplierId(created.id);
        setNewSupplierName('');
        setShowAddSupplier(false);
      }
    } catch {
      /* silencieux : l'ajout ne bloque pas la création du produit */
    } finally {
      setSupplierSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setAvailDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const updatePerso = (
    key: string,
    field: 'label' | 'price' | 'required',
    value: string | boolean
  ) => {
    setPersoFields((prev) => prev.map((f) => (f.key === key ? { ...f, [field]: value } : f)));
  };

  const addPersoField = () => {
    setPersoFields((prev) => [
      ...prev,
      { key: `p${nextPersoKey.current++}`, label: '', price: '', required: false },
    ]);
  };

  const removePersoField = (key: string) => {
    setPersoFields((prev) => prev.filter((f) => f.key !== key));
  };

  // Visibility
  const [isVisibleOnPublicPage, setIsVisibleOnPublicPage] = useState(true);
  const [isVisibleOnMarketplace, setIsVisibleOnMarketplace] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories: any[] = Array.isArray(catsData) ? catsData : catsData?.data || [];
  const notifyError = useNotifyError();

  /** Upload réel : seul le dataUrl (nouvelle image) part au serveur, compressé côté client. */
  const uploadNewImages = useCallback(async (imgs: DropImage[]): Promise<string[]> => {
    const fresh = imgs.filter((i) => i.dataUrl.startsWith('data:'));
    if (fresh.length === 0) return [];
    setUploading(true);
    try {
      const res = await apiClient.uploadMultipleMedia(
        fresh.map((f, i) => dataUrlToFile(f.dataUrl, f.name || `produit-${i + 1}.jpg`))
      );
      const data = res.data?.data;
      const urls: string[] = Array.isArray(data) ? data.map((d: any) => d.url).filter(Boolean) : [];
      return urls;
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.value.name.trim()) return;
    if (!form.value.priceOnDemand && !form.value.price) return;
    setSaving(true);

    try {
      // 1. Vrai upload des images compressées
      const imageUrls = await uploadNewImages(images);

      const data: any = {
        name: form.value.name.trim(),
        shortDescription: form.value.shortDescription.trim() || undefined,
        description: form.value.description.trim() || undefined,
        brand: form.value.brand.trim() || undefined,
        sku: form.value.sku.trim() || undefined,
        barcode: form.value.barcode.trim() || undefined,
        categoryId: categoryId || undefined,
        tags,
        price: form.value.priceOnDemand ? 0 : Number(form.value.price) || 0,
        priceOnDemand: form.value.priceOnDemand,
        currency,
        images: imageUrls,
        video: video.trim() || undefined,
        stock: availability === 'out_of_stock' ? 0 : Number(form.value.stock) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        unit,
        isOnPreOrder: availability === 'pre_order',
        isPromotional,
        promotionalPrice:
          isPromotional && promotionalPrice > 0 ? Number(promotionalPrice) : undefined,
        discountPercent: autoDiscount || 0,
        weight: form.value.weight ? Number(form.value.weight) : undefined,
        dimensions: dimensions.trim() || undefined,
        isPhysical,
        deliveryFee: form.value.deliveryFee ? Number(form.value.deliveryFee) : undefined,
        isVisibleOnPublicPage,
        isVisibleOnMarketplace,
        isActive,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
      };

      if (hasVariants) {
        data.hasVariants = true;
        data.variants = variants
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            sku: v.sku.trim() || undefined,
            price: v.price ? Number(v.price) : Number(form.value.price),
            stock: Number(v.stock) || 0,
          }));
      }

      // 2. Création du produit
      const res = await createProduct.mutateAsync(data);
      const createdId = res?.data?.data?.id;

      // 3. Épargne Achat : activation sur le produit fraîchement créé
      if (enableLayaway && createdId) {
        try {
          await apiClient.createLayawayOffer({
            itemType: 'PRODUCT',
            itemId: createdId,
            durationDays: Number(layawayDuration) || 90,
            minInstallment: layawayMinInstallment || 2000,
          });
        } catch (layErr) {
          // L'épargne ne bloque pas la création du produit
          console.warn('Layaway activation skipped:', layErr);
        }
      }

      // 3b. Affiliation : génère le lien de partage (chaque client devient un vendeur)
      if (enableAffiliate && createdId) {
        try {
          await apiClient.createAffiliateLink({
            itemType: 'PRODUCT',
            itemId: createdId,
            commissionPercent: Number(affiliatePercent) || 5,
          });
        } catch (affErr) {
          console.warn('Affiliate link skipped:', affErr);
        }
      }

      // 4. Étape C — Réglages avancés : rattacher les mécanismes au produit créé
      if (createdId) {
        const attach = async (sourceType: string, config: any) => {
          try {
            await apiClient.createCatalogAttachment({
              itemType: 'PRODUCT',
              itemId: createdId,
              sourceType,
              config,
            });
          } catch (attErr) {
            // Un rattachement qui échoue ne bloque pas la création du produit
            console.warn(`Attachment ${sourceType} skipped:`, attErr);
          }
        };
        const tasks: Promise<void>[] = [];
        if (Number(taxRate) > 0) tasks.push(attach('TAX', { rate: Number(taxRate) }));
        if (minQuantity !== '' || maxQuantity !== '') {
          tasks.push(
            attach('MIN_MAX_QTY', {
              minQuantity: Number(minQuantity) || 1,
              maxQuantity: Number(maxQuantity),
            })
          );
        }
        if (enableAvailability) {
          tasks.push(
            attach('AVAILABILITY', {
              days: availDays,
              hours: [{ open: availOpen, close: availClose }],
            })
          );
        }
        const validPerso = persoFields.filter((f) => f.label.trim());
        if (validPerso.length > 0) {
          tasks.push(
            attach('PERSONALIZATION', {
              fields: validPerso.map((f) => ({
                key: f.key,
                label: f.label.trim(),
                price: Number(f.price) || 0,
                required: f.required,
              })),
            })
          );
        }
        if (Number(giftWrapPrice) > 0)
          tasks.push(attach('GIFT_WRAP', { price: Number(giftWrapPrice) }));
        if (Number(timeslotMinutes) > 0) {
          tasks.push(attach('TIMESLOT', { durationMinutes: Number(timeslotMinutes) }));
        }
        if (crossSellIds.length > 0) {
          tasks.push(
            attach('CROSS_SELL', {
              items: crossSellIds.map((id) => ({ itemType: 'PRODUCT', itemId: id })),
            })
          );
        }

        // ── Étape E — mécanismes 2027 ──
        if (allowNegotiation) {
          tasks.push(attach('NEGOTIATION', { enabled: true }));
        }
        if (customBadgeLabel.trim()) {
          tasks.push(
            attach('CUSTOM_BADGE', { label: customBadgeLabel.trim(), emoji: customBadgeEmoji })
          );
        }
        if (Number(warrantyDays) > 0) {
          tasks.push(
            attach('WARRANTY', {
              durationDays: Number(warrantyDays),
              conditions: warrantyConditions.trim() || undefined,
            })
          );
        }
        if (returnDays !== '') {
          tasks.push(
            attach('RETURN_POLICY', {
              days: Number(returnDays) || 0,
              conditions: returnConditions.trim() || undefined,
            })
          );
        }
        if (lotTracking) {
          tasks.push(
            attach('LOT_TRACE', {
              trackLots: true,
              defaultExpiryDays: Number(lotExpiryDays) || undefined,
            })
          );
        }
        if (Number(commissionPercent) > 0) {
          tasks.push(attach('COMMISSION', { percent: Number(commissionPercent) }));
        }
        if (!storePickupEnabled) {
          tasks.push(attach('STORE_PICKUP', { available: false }));
        }
        const validTiers = tierRows.filter(
          (r) => Number(r.minQuantity) > 0 && Number(r.percent) > 0
        );
        if (validTiers.length > 0) {
          tasks.push(
            attach('DISCOUNT_TIER', {
              tiers: validTiers.map((r) => ({
                minQuantity: Number(r.minQuantity),
                percent: Number(r.percent),
              })),
            })
          );
        }
        if (selectedSupplierId) {
          tasks.push(
            attach('SUPPLIER', {
              supplierId: selectedSupplierId,
              costPrice: supplierCostPrice ? Number(supplierCostPrice) : undefined,
            })
          );
        }
        await Promise.all(tasks);
      }

      form.reset();
      router.push('/dashboard/products');
    } catch (err) {
      notifyError(err, 'Erreur', 'Impossible de créer le produit');
      setSaving(false);
    }
  };

  const isPending = saving || uploading || createProduct.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        title="Nouveau produit"
        description="Ajoutez un produit à votre catalogue — photos, prix sur demande, épargne"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Produits', href: '/dashboard/products' },
          { label: 'Nouveau produit' },
        ]}
        actions={
          <>
            {form.hasDraft && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg">
                <Sparkles className="h-3.5 w-3.5" /> Brouillon restauré
              </span>
            )}
            <Link href="/dashboard/products">
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* A — Informations principales */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Package className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Informations principales
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Nom du produit *"
                value={form.value.name}
                onChange={(e) => form.setValue('name', e.target.value)}
                placeholder="Ex: Tissu Wax Africain"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description courte
              </label>
              <input
                value={form.value.shortDescription}
                onChange={(e) => form.setValue('shortDescription', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 outline-none transition-all"
                placeholder="Brève description (max 150 caractères)"
                maxLength={150}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description complète
              </label>
              <textarea
                value={form.value.description}
                onChange={(e) => form.setValue('description', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 outline-none transition-all resize-none min-h-[100px]"
                placeholder="Description détaillée du produit..."
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Catégorie
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 outline-none transition-all"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon || '📦'} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Marque"
              value={form.value.brand}
              onChange={(e) => form.setValue('brand', e.target.value)}
              placeholder="Ex: Wax Africain"
            />
            <Input
              label="SKU / Référence"
              value={form.value.sku}
              onChange={(e) => form.setValue('sku', e.target.value)}
              placeholder="Ex: WAX-001"
            />
            <Input
              label="Code-barres"
              value={form.value.barcode}
              onChange={(e) => form.setValue('barcode', e.target.value)}
              placeholder="Ex: 4901234567890"
            />
            <div className="sm:col-span-2">
              <Input
                label="Tags (séparés par des virgules)"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="Ex: wax, africain, tissu, mode"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* B — Médias : vrai upload, compressé côté client */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Package className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Médias
            </h3>
          </div>
          <div className="space-y-4">
            <ImageDropzone
              label="Photos du produit"
              images={images}
              onChange={setImages}
              maxImages={6}
              help="Glissez vos photos — elles sont compressées sur votre téléphone avant l'envoi (réalité africaine : pas d'upload de 3 Mo sur du 2G)."
            />
            <Input
              label="Vidéo produit (URL)"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </Card>

        {/* C — Prix */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Prix
            </h3>
          </div>

          {/* Prix sur demande — la réalité africaine : pas toujours un prix affiché */}
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={form.value.priceOnDemand}
              onChange={(e) => form.setValue('priceOnDemand', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Prix sur demande 💬
              </p>
              <p className="text-xs text-gray-500">
                Le client vous contacte pour connaître le prix (idéal pour le sur-mesure, les
                grosses commandes)
              </p>
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={cn(form.value.priceOnDemand && 'opacity-50 pointer-events-none')}>
              <MoneyInput
                label="Prix normal"
                value={form.value.priceOnDemand ? null : form.value.price}
                onChange={(v) => form.setValue('price', v)}
                currency={currency}
                placeholder="5000"
                required={!form.value.priceOnDemand}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Devise
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all"
              >
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPromotional}
                  onChange={(e) => setIsPromotional(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  En promotion
                </span>
              </label>
            </div>
          </div>

          {isPromotional && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MoneyInput
                  label="Prix promotionnel"
                  value={promotionalPrice}
                  onChange={setPromotionalPrice}
                  currency={currency}
                  placeholder="4000"
                />
                <Input
                  label="Réduction (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent || autoDiscount.toString()}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="20"
                />
                <div className="flex items-center">
                  {autoDiscount > 0 && (
                    <div className="px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <p className="text-xs text-gray-500">Prix barré automatique</p>
                      <p className="text-sm font-bold text-red-600">-{autoDiscount}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* C2 — Épargne Achat : le client épargne pour ce produit (escrow sécurisé) */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Épargne Achat
            </h3>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={enableLayaway}
              onChange={(e) => setEnableLayaway(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Activer l'épargne sur ce produit 🐷
              </p>
              <p className="text-xs text-gray-500">
                Vos clients peuvent épargner par petites cotisations — l'argent est sécurisé en
                escrow et vous est libéré à l'achat (commission 1%)
              </p>
            </div>
          </label>

          {enableLayaway && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Durée d'épargne
                </label>
                <select
                  value={layawayDuration}
                  onChange={(e) => setLayawayDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all"
                >
                  <option value="30">30 jours</option>
                  <option value="60">60 jours</option>
                  <option value="90">90 jours</option>
                  <option value="180">6 mois</option>
                  <option value="365">12 mois</option>
                </select>
              </div>
              <MoneyInput
                label="Cotisation minimale"
                value={layawayMinInstallment}
                onChange={setLayawayMinInstallment}
                currency={currency}
                placeholder="2000"
                help="Montant minimum que le client doit verser à chaque fois"
              />
            </div>
          )}
        </Card>

        {/* C3 — Réglages avancés : mécanismes rattachés (taxe, quantités, dispo, perso, cadeau, créneau, croisées) */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Réglages avancés
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Taxe par article (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="Ex. 18 (TVA)"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1">Ajoutée au prix payé par le client</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Quantité min
              </label>
              <input
                type="number"
                min={1}
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Quantité max
              </label>
              <input
                type="number"
                min={1}
                value={maxQuantity}
                onChange={(e) => setMaxQuantity(e.target.value)}
                placeholder="Ex. 10"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all"
              />
            </div>
          </div>

          {/* Disponibilité programmée */}
          <div className="mt-5 p-4 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAvailability}
                onChange={(e) => setEnableAvailability(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Disponibilité programmée 🕒
                </p>
                <p className="text-xs text-gray-500">
                  L'article n'est commandable que certains jours / heures — les commandes hors
                  créneau sont refusées
                </p>
              </div>
            </label>
            {enableAvailability && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Jours ouverts</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { d: 1, l: 'Lun' },
                      { d: 2, l: 'Mar' },
                      { d: 3, l: 'Mer' },
                      { d: 4, l: 'Jeu' },
                      { d: 5, l: 'Ven' },
                      { d: 6, l: 'Sam' },
                      { d: 0, l: 'Dim' },
                    ].map(({ d, l }) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all',
                          availDays.includes(d)
                            ? 'border-brand bg-brand-50 dark:bg-brand-900/30 text-brand'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500'
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Aucun jour sélectionné = ouvert tous les jours
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ouvre à</label>
                    <input
                      type="time"
                      value={availOpen}
                      onChange={(e) => setAvailOpen(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Ferme à</label>
                    <input
                      type="time"
                      value={availClose}
                      onChange={(e) => setAvailClose(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Personnalisation */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Personnalisation ✍️
                </p>
                <p className="text-xs text-gray-500">
                  Gravure, broderie, taille sur mesure — champ client avec prix additionnel
                </p>
              </div>
              <button
                type="button"
                onClick={addPersoField}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter un champ
              </button>
            </div>
            <div className="space-y-2">
              {persoFields.map((f) => (
                <div
                  key={f.key}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto_auto] gap-2 items-center"
                >
                  <input
                    value={f.label}
                    onChange={(e) => updatePerso(f.key, 'label', e.target.value)}
                    placeholder="Ex. Texte à graver"
                    className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                  />
                  <input
                    type="number"
                    min={0}
                    value={f.price}
                    onChange={(e) => updatePerso(f.key, 'price', e.target.value)}
                    placeholder="Prix FCFA"
                    className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updatePerso(f.key, 'required', e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-brand"
                    />
                    Requis
                  </label>
                  <button
                    type="button"
                    onClick={() => removePersoField(f.key)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    title="Retirer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Emballage cadeau + créneau + ventes croisées */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Emballage cadeau (FCFA)
              </label>
              <input
                type="number"
                min={0}
                value={giftWrapPrice}
                onChange={(e) => setGiftWrapPrice(e.target.value)}
                placeholder="Ex. 1000"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Créneau horaire (min)
              </label>
              <input
                type="number"
                min={5}
                value={timeslotMinutes}
                onChange={(e) => setTimeslotMinutes(e.target.value)}
                placeholder="Ex. 30"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Réservation sur créneau — 1 unité max
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Ventes croisées 🔁
              </label>
              <select
                multiple
                value={crossSellIds}
                onChange={(e) =>
                  setCrossSellIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                }
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm min-h-[44px] focus:border-brand outline-none"
              >
                {crossSellList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                « Les clients achètent aussi » (Ctrl + clic)
              </p>
            </div>
          </div>

          {/* ── Étape E — Négociation + badge + confiance (garantie, retour, lot) ── */}
          <div className="mt-5 p-4 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNegotiation}
                  onChange={(e) => setAllowNegotiation(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Autoriser la négociation 🤝
                  </p>
                  <p className="text-xs text-gray-500">
                    Le client propose son prix — vous acceptez ou contre-proposez (Prix Flash
                    Client)
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lotTracking}
                  onChange={(e) => setLotTracking(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Traçabilité lot + péremption 📦
                  </p>
                  <p className="text-xs text-gray-500">
                    Vivres et produits frais : numéro de lot et date de péremption
                  </p>
                </div>
              </label>
            </div>
            {lotTracking && (
              <div className="mt-3 max-w-xs">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Péremption par défaut (jours)
                </label>
                <input
                  type="number"
                  min={1}
                  value={lotExpiryDays}
                  onChange={(e) => setLotExpiryDays(e.target.value)}
                  placeholder="Ex. 180"
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                />
              </div>
            )}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Badge personnalisé
                </label>
                <div className="flex gap-2">
                  <input
                    value={customBadgeLabel}
                    onChange={(e) => setCustomBadgeLabel(e.target.value)}
                    placeholder="Ex. Édition limitée"
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                  />
                  <input
                    value={customBadgeEmoji}
                    onChange={(e) => setCustomBadgeEmoji(e.target.value)}
                    className="w-14 px-2 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center outline-none focus:border-brand"
                    title="Emoji du badge"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Garantie (jours)
                </label>
                <input
                  type="number"
                  min={1}
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(e.target.value)}
                  placeholder="Ex. 365"
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Retour / SAV (jours)
                </label>
                <input
                  type="number"
                  min={0}
                  value={returnDays}
                  onChange={(e) => setReturnDays(e.target.value)}
                  placeholder="Ex. 7"
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Commission employé (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                  placeholder="Ex. 2"
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
            <label className="mt-4 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={storePickupEnabled}
                onChange={(e) => setStorePickupEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Retrait en boutique 🏪
                </p>
                <p className="text-xs text-gray-500">
                  Décochez si cet article n'est jamais retiré sur place
                </p>
              </div>
            </label>
          </div>

          {/* ── Étape E — Prix dégressifs par quantité (grossiste) ── */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Prix dégressifs par quantité 📉
                </p>
                <p className="text-xs text-gray-500">
                  3 articles = −5%, 10 = −10% — le bon prix pour le détail ET le demi-gros
                </p>
              </div>
              <button
                type="button"
                onClick={addTierRow}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter un palier
              </button>
            </div>
            {tierRows.length > 0 && (
              <div className="space-y-2">
                {tierRows.map((r) => (
                  <div
                    key={r.key}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2 items-center"
                  >
                    <input
                      type="number"
                      min={1}
                      value={r.minQuantity}
                      onChange={(e) => updateTierRow(r.key, 'minQuantity', e.target.value)}
                      placeholder="Quantité min (ex. 3)"
                      className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={r.percent}
                      onChange={(e) => updateTierRow(r.key, 'percent', e.target.value)}
                      placeholder="Remise % (ex. 5)"
                      className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => removeTierRow(r.key)}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                      title="Retirer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Étape F — Programme d'affiliation ── */}
          <div className="mt-5 p-4 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAffiliate}
                onChange={(e) => setEnableAffiliate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Programme d'affiliation 🤝
                </p>
                <p className="text-xs text-gray-500">
                  Chaque client devient un vendeur : il partage le lien, vous gagnez une vente, il
                  touche sa commission
                </p>
              </div>
            </label>
            {enableAffiliate && (
              <div className="mt-3 max-w-xs">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Commission du partenaire (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={affiliatePercent}
                  onChange={(e) => setAffiliatePercent(e.target.value)}
                  placeholder="Ex. 5"
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Lien généré après création : /r/CODE — commission créditée à chaque commande payée
                </p>
              </div>
            )}
          </div>

          {/* ── Étape E — Fournisseur ── */}
          <div className="mt-5">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Fournisseur 🏭</p>
            <p className="text-xs text-gray-500 mb-2">
              Qui approvisionne cet article + prix d'achat (marge calculée automatiquement)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2">
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                >
                  <option value="">Aucun fournisseur</option>
                  {suppliersList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddSupplier((v) => !v)}
                  className="px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-xs font-medium text-brand hover:border-brand/50 transition-colors"
                >
                  {showAddSupplier ? 'Fermer' : '+ Nouveau'}
                </button>
              </div>
              <input
                type="number"
                min={0}
                value={supplierCostPrice}
                onChange={(e) => setSupplierCostPrice(e.target.value)}
                placeholder="Prix d'achat FCFA (marge)"
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
              />
            </div>
            {showAddSupplier && (
              <div className="mt-2 flex gap-2">
                <input
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Nom du fournisseur"
                  className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none focus:border-brand"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addSupplier}
                  disabled={supplierSaving}
                >
                  {supplierSaving ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* D — Stock */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Box className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Stock
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Quantité disponible"
              type="number"
              min={0}
              value={form.value.stock}
              onChange={(e) => form.setValue('stock', Number(e.target.value))}
              placeholder="10"
              disabled={availability === 'out_of_stock'}
            />
            <Input
              label="Stock minimum (alerte)"
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="5"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Unité
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none transition-all"
              >
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
            <label
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all',
                availability === 'in_stock'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <input
                type="radio"
                name="availability"
                checked={availability === 'in_stock'}
                onChange={() => setAvailability('in_stock')}
                className="text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium">En stock</span>
            </label>
            <label
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all',
                availability === 'out_of_stock'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <input
                type="radio"
                name="availability"
                checked={availability === 'out_of_stock'}
                onChange={() => setAvailability('out_of_stock')}
                className="text-red-500 focus:ring-red-500"
              />
              <span className="text-sm font-medium">Rupture</span>
            </label>
            <label
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all',
                availability === 'pre_order'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <input
                type="radio"
                name="availability"
                checked={availability === 'pre_order'}
                onChange={() => setAvailability('pre_order')}
                className="text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm font-medium">Précommande</span>
            </label>
          </div>
        </Card>

        {/* E — Variantes */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Variantes
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Activer les variantes
              </span>
            </label>
          </div>

          {hasVariants && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
                <div className="col-span-4">Nom (Taille/Couleur)</div>
                <div className="col-span-3">SKU</div>
                <div className="col-span-2 text-right">Prix</div>
                <div className="col-span-2 text-right">Stock</div>
                <div className="col-span-1"></div>
              </div>
              {variants.map((v) => (
                <div key={v.key} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <input
                      value={v.name}
                      onChange={(e) => updateVariant(v.key, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none"
                      placeholder="Ex: XL, Rouge"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      value={v.sku}
                      onChange={(e) => updateVariant(v.key, 'sku', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none"
                      placeholder="SKU"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      value={v.price}
                      onChange={(e) => updateVariant(v.key, 'price', e.target.value)}
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none text-right"
                      placeholder={String(form.value.price) || '0'}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      value={v.stock}
                      onChange={(e) => updateVariant(v.key, 'stock', e.target.value)}
                      type="number"
                      min={0}
                      className="w-full px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand outline-none text-right"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeVariant(v.key)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Ajouter une variante
              </button>
            </div>
          )}
        </Card>

        {/* F — Livraison */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Truck className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Livraison
            </h3>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPhysical}
                onChange={(e) => setIsPhysical(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Produit physique (livrable)
              </span>
            </label>
          </div>
          {isPhysical && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MoneyInput
                label="Poids (kg)"
                value={form.value.weight}
                onChange={(v) => form.setValue('weight', v)}
                currency="kg"
                placeholder="0.5"
              />
              <Input
                label="Dimensions"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="Ex: 30x20x10 cm"
              />
              <MoneyInput
                label="Frais de livraison"
                value={form.value.deliveryFee}
                onChange={(v) => form.setValue('deliveryFee', v)}
                currency={currency}
                placeholder="2000"
              />
            </div>
          )}
        </Card>

        {/* G — Visibilité */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Eye className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Visibilité
            </h3>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisibleOnPublicPage}
                onChange={(e) => setIsVisibleOnPublicPage(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Afficher sur la page publique
                </p>
                <p className="text-xs text-gray-500">Visible sur votre site public</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisibleOnMarketplace}
                onChange={(e) => setIsVisibleOnMarketplace(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Afficher sur le marketplace
                </p>
                <p className="text-xs text-gray-500">Visible dans les recherches globales</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Produit actif
                </p>
                <p className="text-xs text-gray-500">Disponible à la vente</p>
              </div>
            </label>
          </div>
        </Card>

        {/* H — SEO */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Search className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              SEO
            </h3>
          </div>
          <div className="space-y-4">
            <Input
              label="Titre SEO"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={form.value.name || 'Titre pour les moteurs de recherche'}
              maxLength={200}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description SEO
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand outline-none transition-all resize-none"
                placeholder="Description pour les moteurs de recherche"
                rows={2}
                maxLength={300}
              />
              <p className="text-xs text-gray-400 mt-1">{seoDescription.length || 0}/300</p>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 -mx-4 -mb-4 rounded-b-2xl border-t border-gray-100 dark:border-gray-800">
          {uploading && (
            <span className="flex items-center gap-1.5 text-xs text-brand">
              <Loader2 className="h-4 w-4 animate-spin" /> Upload des photos…
            </span>
          )}
          <Link href="/dashboard/products">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={isPending}
            disabled={!form.value.name.trim() || (!form.value.priceOnDemand && !form.value.price)}
          >
            <Save className="h-4 w-4 mr-1.5" />
            Enregistrer le produit
          </Button>
        </div>
      </form>
    </div>
  );
}
