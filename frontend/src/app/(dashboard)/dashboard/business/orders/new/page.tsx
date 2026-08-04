'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  StickyNote,
  Search,
  Loader,
  Save,
  CreditCard,
  Percent,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/utils/helpers';

const ORDER_TYPES = [
  { value: 'PICKUP', label: 'À emporter' },
  { value: 'DELIVERY', label: 'Livraison' },
  { value: 'DINE_IN', label: 'Sur place' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
];

const PAYMENT_METHODS = [
  'MOBILE_MONEY',
  'WAVE',
  'CASH',
  'CARD',
  'BANK_TRANSFER',
  'ESCROW',
  'CREDIT',
];

export default function NewBusinessOrderPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderType, setOrderType] = useState('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<
    { productId?: string; name: string; quantity: number; unitPrice: number; image?: string }[]
  >([]);
  const [created, setCreated] = useState(false);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['my-products', 'order-picker'],
    queryFn: async () => {
      const res = await apiClient.getMyProducts({ limit: 200 });
      return res.data.data;
    },
    enabled: !!user,
  });

  const products = useMemo(() => {
    const list = Array.isArray(productsData)
      ? productsData
      : productsData?.items || productsData?.data || [];
    return (list || []).filter((p: any) => p.isActive !== false);
  }, [productsData]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? products.filter(
          (p: any) =>
            (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
        )
      : products;
  }, [products, search]);

  const addItem = (product: any) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: Number(product.price || product.salePrice || 0),
          image: product.images?.[0] || product.image,
        },
      ];
    });
  };

  const updateItem = (idx: number, patch: Partial<(typeof items)[number]>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal + Number(deliveryFee || 0) - Number(discount || 0));

  const createOrder = useMutation({
    mutationFn: async () => {
      const payload: any = {
        type: orderType,
        source: 'WALK_IN',
        paymentMethod,
        deliveryAddress,
        notes,
        tax: 0,
        deliveryFee: Number(deliveryFee || 0),
        discount: Number(discount || 0),
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: '',
        })),
      };
      if (customerName) payload.customerName = customerName;
      if (customerPhone) payload.customerPhone = customerPhone;
      if (customerEmail) payload.customerEmail = customerEmail;
      return apiClient.createBusinessOrder(payload);
    },
    onSuccess: () => {
      setCreated(true);
      qc.invalidateQueries({ queryKey: ['business', 'orders'] });
      qc.invalidateQueries({ queryKey: ['my-products'] });
      setTimeout(() => router.push('/dashboard/orders'), 1400);
    },
  });

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          Commande créée !
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          La commande a été enregistrée. Redirection vers vos commandes...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </Link>
        <PageHeader
          title="Nouvelle commande"
          description="Créez une commande manuellement (téléphone, WhatsApp, comptoir)"
          breadcrumbs={[{ label: 'Commandes', href: '/dashboard/orders' }, { label: 'Nouvelle' }]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: product picker */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Articles du catalogue
              </h3>
              <span className="text-xs text-gray-500">{items.length} sélectionné(s)</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
              />
            </div>
            {productsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">
                {search
                  ? 'Aucun produit trouvé.'
                  : 'Aucun produit actif. Ajoutez d’abord des produits à votre catalogue.'}
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-brand/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                      {p.images?.[0] || p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images?.[0] || p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(Number(p.price || 0))}
                        {p.stock !== undefined && p.stock !== null && (
                          <span className="ml-2 text-gray-400">Stock: {p.stock}</span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addItem(p)}
                      disabled={p.stock !== undefined && p.stock !== null && p.stock <= 0}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Selected items */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Articles de la commande
            </h3>
            {items.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-6">
                Aucun article ajouté — sélectionnez des produits à gauche.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)} / unité</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(idx, { quantity: Math.max(1, item.quantity - 1) })
                        }
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })
                        }
                        className="w-12 text-center text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-1 bg-transparent dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => updateItem(idx, { quantity: item.quantity + 1 })}
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        +
                      </button>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(idx, { unitPrice: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="w-24 text-right text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-1 bg-transparent dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: customer + summary */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="h-4 w-4 text-brand" /> Client
            </h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom du client</label>
              <Input
                placeholder="Nom complet"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                <Phone className="h-3 w-3" /> Téléphone
              </label>
              <Input
                placeholder="+225 07 00 00 00 00"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email (optionnel)</label>
              <Input
                type="email"
                placeholder="client@exemple.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <Select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  options={ORDER_TYPES}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Paiement
                </label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={PAYMENT_METHODS.map((m) => ({ value: m, label: m.replace(/_/g, ' ') }))}
                />
              </div>
            </div>
            {orderType === 'DELIVERY' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Adresse de livraison
                </label>
                <Input
                  placeholder="Quartier, ville..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                <StickyNote className="h-3 w-3" /> Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Instructions particulières..."
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Récapitulatif
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                  <Percent className="h-3 w-3" /> Remise (FCFA)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Livraison (FCFA)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Remise</span>
                <span>− {formatPrice(Number(discount || 0))}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Livraison</span>
                <span>{formatPrice(Number(deliveryFee || 0))}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 text-base pt-1">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={items.length === 0 || createOrder.isPending}
              onClick={() => createOrder.mutate()}
            >
              {createOrder.isPending ? (
                <Loader className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Créer la commande
            </Button>
            {createOrder.isError && (
              <p className="text-xs text-red-500 text-center">
                Erreur lors de la création : {(createOrder.error as any)?.message}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
