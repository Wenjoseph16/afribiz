'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';
import { useQuery } from '@tanstack/react-query';

interface CartItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isBusiness = user?.roles?.includes('BUSINESS') || user?.primaryRole === 'BUSINESS';

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ['products', 'new-order'],
    queryFn: async () => {
      const res = await apiClient.get('/business/products?limit=200');
      return res.data.data;
    },
    enabled: isBusiness,
  });

  const products = Array.isArray(productsData)
    ? productsData
    : productsData?.products || productsData?.data || [];

  const addToCart = (p: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing)
        return prev.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [
        ...prev,
        { productId: p.id, name: p.name, quantity: 1, unitPrice: Number(p.price || 0) },
      ];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
  };

  const removeItem = (productId: string) =>
    setCart((prev) => prev.filter((i) => i.productId !== productId));

  const total = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
      };
      const res = isBusiness
        ? await apiClient.post('/business/orders', payload)
        : await apiClient.post('/orders', payload);
      router.push(isBusiness ? '/dashboard/business/orders' : '/dashboard/orders');
    } catch (err) {
      console.error('Order creation failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(
    (p: any) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle commande</h1>
          <p className="text-sm text-gray-500">Créez une commande pour un client</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {isBusiness && (
            <Card className="p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Produits</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filtered.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {Number(p.price || 0).toLocaleString()} FCFA
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-emerald-500" />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun produit trouvé</p>
                )}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Informations client</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nom du client"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <Input
                placeholder="Téléphone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <Input
                placeholder="Email (optionnel)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <Input
                placeholder="Adresse de livraison (optionnel)"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>
            <textarea
              className="mt-3 w-full rounded-lg border border-gray-200 p-2.5 text-sm"
              rows={2}
              placeholder="Notes (optionnel)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">
              Panier ({cart.length} article{cart.length > 1 ? 's' : ''})
            </h2>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Panier vide</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.unitPrice.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.productId!, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-white border text-sm font-medium"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId!, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-white border text-sm font-medium"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId!)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-lg text-emerald-600">
                {total.toLocaleString()} FCFA
              </span>
            </div>
            <Button
              className="mt-3 w-full"
              onClick={handleSubmit}
              disabled={cart.length === 0 || submitting}
            >
              {submitting ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting ? 'Création...' : 'Créer la commande'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
