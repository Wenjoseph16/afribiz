'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  CheckCircle2,
  Loader,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Printer,
  RefreshCcw,
  Search,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
  Truck,
  User,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { formatPrice } from '@/utils/helpers';

type FulfillmentType = 'DINE_IN' | 'TAKEAWAY' | 'PICKUP' | 'DELIVERY';
type PaymentType = 'CASH' | 'MOBILE_MONEY' | 'CREDIT';

interface CartItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string;
  stock?: number;
}

const FULFILLMENTS: { value: FulfillmentType; label: string; hint: string; icon: any }[] = [
  { value: 'DINE_IN', label: 'Sur place', hint: 'Service en salle', icon: UtensilsCrossed },
  { value: 'TAKEAWAY', label: 'À emporter', hint: 'Emballé au comptoir', icon: ShoppingBag },
  { value: 'PICKUP', label: 'Retrait', hint: 'Le client récupère', icon: Store },
  { value: 'DELIVERY', label: 'Livraison', hint: 'Zone + frais', icon: Truck },
];

const PAYMENTS: { value: PaymentType; label: string; hint: string; icon: any }[] = [
  { value: 'CASH', label: 'Espèces', hint: 'Billet / monnaie', icon: Banknote },
  { value: 'MOBILE_MONEY', label: 'Mobile Money', hint: 'Wave, MTN, Orange…', icon: Smartphone },
  { value: 'CREDIT', label: 'À crédit', hint: 'Dette + rappel auto', icon: Wallet },
];

function defaultDueDate(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = '225' + digits.slice(1);
  return digits;
}

export default function PointOfSalePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { business } = useBusinessStore();
  const businessName = business?.name || 'Mon business';

  // ── État du POS ──
  const [client, setClient] = useState<{ id?: string; name: string; phone: string; debtBalance?: number } | null>(null);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<CartItem[]>([]);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('DINE_IN');
  const [zoneId, setZoneId] = useState('');
  const [payment, setPayment] = useState<PaymentType>('CASH');
  const [received, setReceived] = useState('');
  const [paidMobile, setPaidMobile] = useState('');
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [notes, setNotes] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [debtPayState, setDebtPayState] = useState<Record<string, { amount: string; loading: boolean }>>({});
  const [debtFeedback, setDebtFeedback] = useState<string | null>(null);

  // ── Données ──
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['my-products', 'pos'],
    queryFn: async () => {
      const res = await apiClient.getMyProducts({ limit: 200 });
      return res.data.data;
    },
    enabled: !!user,
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['business-clients', 'pos'],
    queryFn: async () => {
      const res = await apiClient.getBusinessClients({ limit: 100 });
      return res.data.data;
    },
    enabled: !!user,
  });

  const { data: zonesData } = useQuery({
    queryKey: ['delivery-zones', 'pos'],
    queryFn: async () => {
      const res = await apiClient.getDeliveryZones();
      return res.data.data;
    },
    enabled: !!user,
  });

  const products = useMemo(() => {
    const list = Array.isArray(productsData)
      ? productsData
      : productsData?.products || productsData?.items || productsData?.data || [];
    return (list || []).filter((p: any) => p.isActive !== false);
  }, [productsData]);

  const { data: clientDebtsData, refetch: refetchClientDebts } = useQuery({
    queryKey: ['client-debts', 'pos', client?.id],
    queryFn: async () => {
      const res = await apiClient.getDebts({ buyerId: client?.id, limit: 10 });
      return res.data.data;
    },
    enabled: debtModalOpen && !!client?.id,
  });

  const clientDebts = useMemo(() => {
    const list = Array.isArray(clientDebtsData)
      ? clientDebtsData
      : clientDebtsData?.debts || clientDebtsData?.data || [];
    return (list || []).filter(
      (d: any) => d.status === 'ACTIVE' || d.status === 'PARTIALLY_PAID' || d.status === 'OVERDUE' || d.status === 'CRITICAL'
    );
  }, [clientDebtsData]);

  const payClientDebt = async (debt: any) => {
    const st = debtPayState[debt.id];
    const amount = Number(st?.amount || debt.amount || 0);
    if (!amount || amount <= 0) {
      setDebtFeedback('Montant invalide');
      return;
    }
    setDebtPayState((prev) => ({ ...prev, [debt.id]: { amount: st?.amount || String(debt.amount || ''), loading: true } }));
    setDebtFeedback(null);
    try {
      await apiClient.registerDebtPayment(debt.id, { amount, paymentMethod: 'CASH' });
      setDebtFeedback('Paiement enregistré ✅');
      refetchClientDebts();
      qc.invalidateQueries({ queryKey: ['business-clients'] });
    } catch (e: any) {
      setDebtFeedback(e?.response?.data?.message || e?.message || 'Erreur');
    } finally {
      setDebtPayState((prev) => ({ ...prev, [debt.id]: { ...prev[debt.id], loading: false } }));
    }
  };

  const clients = useMemo(() => {
    const list = Array.isArray(clientsData)
      ? clientsData
      : clientsData?.clients || clientsData?.data || [];
    return list || [];
  }, [clientsData]);

  const zones = useMemo(() => {
    const list = Array.isArray(zonesData)
      ? zonesData
      : zonesData?.zones || zonesData?.data || [];
    return (list || []).filter((z: any) => z.isActive !== false);
  }, [zonesData]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => {
      const c = p.category?.name || p.categoryName;
      if (c) set.add(String(c));
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p: any) => {
      if (category !== 'all' && !(p.category?.name === category || p.categoryName === category)) return false;
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    });
  }, [products, search, category]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c: any) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const selectedZone = zones.find((z: any) => z.id === zoneId) as any;
  const zoneFee = fulfillment === 'DELIVERY' && selectedZone ? Number(selectedZone.fee || 0) : 0;

  // ── Calculs en direct ──
  const subtotal = items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal + zoneFee - Number(discount || 0));

  const paidAmount = useMemo(() => {
    if (payment === 'CREDIT') return 0;
    if (payment === 'CASH') {
      const r = Number(received || 0);
      return Math.min(r, total);
    }
    const m = Number(paidMobile || 0);
    return m > 0 ? Math.min(m, total) : total;
  }, [payment, received, paidMobile, total]);

  const isCredit = payment === 'CREDIT' || (paidAmount < total && paidAmount > 0);
  const change = payment === 'CASH' ? Math.max(0, Number(received || 0) - total) : 0;
  const remaining = Math.max(0, total - paidAmount);

  const addItem = (p: any) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === p.id
            ? { ...i, quantity: Math.min(i.quantity + 1, p.stock ?? i.quantity + 1) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          quantity: 1,
          unitPrice: Number(p.price || p.salePrice || 0),
          image: p.images?.[0] || p.image,
          stock: p.stock,
        },
      ];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const max = it.stock ?? Infinity;
        return { ...it, quantity: Math.min(Math.max(1, it.quantity + delta), max) };
      })
    );
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const resetSale = () => {
    setItems([]);
    setClient(null);
    setWalkInName('');
    setWalkInPhone('');
    setReceived('');
    setPaidMobile('');
    setDiscount(0);
    setNotes('');
    setPayment('CASH');
    setFulfillment('DINE_IN');
    setZoneId('');
    setCreatedOrder(null);
  };

  const receiptPhone = client?.phone || walkInPhone.trim();

  const createSale = useMutation({
    mutationFn: async () => {
      const payload: any = {
        type: fulfillment,
        source: 'WALK_IN',
        paymentMethod: payment === 'MOBILE_MONEY' ? 'MOBILE_MONEY' : payment,
        buyerId: client?.id || undefined,
        customerName: client ? client.name : walkInName.trim() || undefined,
        customerPhone: receiptPhone || undefined,
        deliveryZoneId: fulfillment === 'DELIVERY' && zoneId ? zoneId : undefined,
        deliveryFee: zoneFee || undefined,
        deliveryAddress:
          fulfillment === 'DELIVERY' && selectedZone ? selectedZone.name : undefined,
        discount: Number(discount || 0),
        notes,
        tax: 0,
        depositAmount: paidAmount > 0 && paidAmount < total ? paidAmount : undefined,
        debtDueDate: remaining > 0 ? dueDate : undefined,
        debtNotes: payment === 'CREDIT' ? 'Vente à crédit (POS)' : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };
      const res = await apiClient.createBusinessOrder(payload);
      return res.data.data;
    },
    onSuccess: (order) => {
      setCreatedOrder(order);
      qc.invalidateQueries({ queryKey: ['business', 'orders'] });
      qc.invalidateQueries({ queryKey: ['my-products'] });
      qc.invalidateQueries({ queryKey: ['business-clients'] });
    },
  });

  const canSubmit = items.length > 0 && !createSale.isPending;

  const paymentLabel =
    payment === 'CASH' ? 'Espèces' : payment === 'MOBILE_MONEY' ? 'Mobile Money' : 'Crédit';
  const fulfillmentLabel = FULFILLMENTS.find((f) => f.value === fulfillment)?.label || '';

  const waMessage = useMemo(() => {
    if (!receiptPhone) return '';
    const lines = [
      `🛒 *${businessName}* — Reçu de vente`,
      `🧾 ${createdOrder?.orderNumber || ''}`,
      `──────────────`,
      ...(createdOrder?.items || []).map(
        (i: any) => `• ${i.name} x${i.quantity} = ${formatPrice(Number(i.total) || 0)}`
      ),
      `──────────────`,
      `💰 Total : ${formatPrice(Number(createdOrder?.totalAmount || 0))}`,
      Number(createdOrder?.deliveryFee || 0) > 0
        ? `🛵 Livraison : ${formatPrice(Number(createdOrder?.deliveryFee || 0))}`
        : null,
      Number(createdOrder?.discountAmount || 0) > 0
        ? `🎁 Remise : − ${formatPrice(Number(createdOrder?.discountAmount || 0))}`
        : null,
      `💳 Paiement : ${paymentLabel}`,
      createdOrder?.debts?.[0]
        ? `📒 Reste à payer : ${formatPrice(Number(createdOrder.debts[0].remainingAmount || 0))} avant le ${dueDate}`
        : null,
      ``,
      `Merci de votre confiance 🙏`,
    ];
    return `https://wa.me/${normalizePhone(receiptPhone)}?text=${encodeURIComponent(
      lines.filter(Boolean).join('\n')
    )}`;
  }, [receiptPhone, createdOrder, dueDate, businessName, paymentLabel]);

  // ── Écran succès ──
  if (createdOrder) {
    const debt = createdOrder.debts?.[0];
    return (
      <div className="max-w-xl mx-auto animate-fade-in py-8">
        <Card className="p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Vente encaissée !
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Commande <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{createdOrder.orderNumber}</span>
          </p>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-4 space-y-2 text-sm text-left mb-6">
            {(createdOrder.items || []).map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  {i.name} <span className="text-gray-400">× {i.quantity}</span>
                </span>
                <span className="font-medium">{formatPrice(Number(i.total) || 0)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-base">
              <span>Total ({fulfillmentLabel})</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {formatPrice(Number(createdOrder.totalAmount || 0))}
              </span>
            </div>
          </div>

          {debt ? (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 mb-6 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3">
              <Wallet className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-semibold">
                  Dette créée : {formatPrice(Number(debt.remainingAmount || 0))}
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  Le client doit payer avant le {new Date(dueDate).toLocaleDateString('fr-FR')}.
                  Un rappel automatique sera envoyé.
                </p>
              </div>
            </div>
          ) : payment === 'CASH' && change > 0 ? (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 mb-6 text-sm text-emerald-800 dark:text-emerald-200">
              💵 Monnaie à rendre : <b>{formatPrice(change)}</b>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {receiptPhone && (
              <a href={waMessage} target="_blank" rel="noreferrer">
                <Button className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1fb958]">
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  Recevoir sur WhatsApp
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="w-full sm:w-auto"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimer
            </Button>
            <Button variant="outline" onClick={resetSale} className="w-full sm:w-auto">
              <RefreshCcw className="h-4 w-4 mr-1.5" />
              Nouvelle vente
            </Button>
          </div>

          <button
            onClick={() => router.push('/dashboard/business/orders')}
            className="mt-6 text-xs text-gray-500 hover:text-brand transition-colors"
          >
            Voir toutes les commandes →
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Point de Vente"
        description="Encaisser une vente comme au comptoir — client, articles, paiement"
        breadcrumbs={[{ label: 'Ventes', href: '/dashboard/business/orders' }, { label: 'Point de vente' }]}
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Comptoir ouvert
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-24 lg:pb-4">
        {/* ══ CATALOGUE ══ */}
        <Card className="lg:col-span-4 p-4 flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-brand" /> Catalogue
            </h3>
            <span className="text-xs text-gray-500">{items.length} article(s)</span>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 mb-1 scrollbar-thin">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    category === c
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {c === 'all' ? 'Tout' : c}
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-y-auto max-h-[46vh] space-y-2 pr-1">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {search || category !== 'all'
                    ? 'Aucun article trouvé.'
                    : 'Ajoutez d’abord des produits à votre catalogue.'}
                </p>
                {!search && category === 'all' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => router.push('/dashboard/products/new')}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un produit
                  </Button>
                )}
              </div>
            ) : (
              filteredProducts.map((p: any) => {
                const out = p.stock !== undefined && p.stock !== null && p.stock <= 0;
                const low = p.stock !== undefined && p.stock !== null && p.stock > 0 && p.stock <= 5;
                return (
                  <button
                    key={p.id}
                    onClick={() => !out && addItem(p)}
                    disabled={out}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      out
                        ? 'opacity-45 cursor-not-allowed border-gray-100 dark:border-gray-800'
                        : 'border-gray-100 dark:border-gray-800 hover:border-brand/50 hover:shadow-sm active:scale-[0.99]'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                      {p.images?.[0] || p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.images?.[0] || p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {p.name}
                      </p>
                      <p className="text-xs font-semibold text-brand">
                        {formatPrice(Number(p.price || 0))}
                      </p>
                      <p
                        className={`text-[11px] ${
                          out
                            ? 'text-red-500'
                            : low
                              ? 'text-amber-500'
                              : 'text-gray-400'
                        }`}
                      >
                        {out ? 'Rupture de stock' : low ? `Stock faible : ${p.stock}` : `Stock : ${p.stock ?? '∞'}`}
                      </p>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        out
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          : 'bg-brand/10 text-brand'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* ══ PANIER + CLIENT ══ */}
        <Card className="lg:col-span-4 p-4 flex flex-col min-h-[420px]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-brand" /> Client & panier
          </h3>

          {/* Client */}
          {client ? (
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-3 flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {client.name}
                </p>
                {client.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {client.phone}
                  </p>
                )}
                {Number(client.debtBalance || 0) > 0 && (
                  <button
                    onClick={() => {
                      setDebtModalOpen(true);
                      setDebtFeedback(null);
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-full hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors"
                  >
                    <Banknote className="h-3 w-3" />
                    Doit {formatPrice(Number(client.debtBalance || 0))} — Encaisser
                  </button>
                )}
              </div>
              <button
                onClick={() => setClient(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Retirer le client"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-brand hover:text-brand transition-colors"
              >
                <User className="h-4 w-4" />
                Choisir un client
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">+ {clientsLoading ? '…' : clients.length} clients</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Client de passage (nom)"
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                />
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="Téléphone (reçu WhatsApp)"
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                />
              </div>
            </div>
          )}

          {/* Panier */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <ShoppingBag className="h-10 w-10 text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm text-gray-500 max-w-[220px]">
                Tapez sur les articles du catalogue pour les ajouter au panier
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[38vh] space-y-2 pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)} / unité</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(idx, -1)}
                      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Minus className="h-3.5 w-3.5 mx-auto" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(idx, 1)}
                      disabled={item.stock !== undefined && item.stock !== null && item.quantity >= item.stock}
                      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5 mx-auto" />
                    </button>
                  </div>
                  <span className="w-20 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatPrice(item.quantity * item.unitPrice)}
                  </span>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">Sous-total</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
            </div>
          )}
        </Card>

        {/* ══ ENCAISSEMENT ══ */}
        <Card className="lg:col-span-4 p-4 space-y-4 min-h-[420px]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-brand" /> Encaissement
          </h3>

          {/* Mode de service */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Mode de service</p>
            <div className="grid grid-cols-2 gap-2">
              {FULFILLMENTS.map((f) => {
                const Icon = f.icon;
                const active = fulfillment === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFulfillment(f.value)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-brand bg-brand/5 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand/40'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-brand' : 'text-gray-400'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {f.label}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{f.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {fulfillment === 'DELIVERY' && (
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Zone de livraison (frais auto)</label>
              {zones.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Aucune zone configurée — le client paiera sans frais de livraison.
                </p>
              ) : (
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                >
                  <option value="">Choisir une zone…</option>
                  {zones.map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {formatPrice(Number(z.fee || 0))}
                      {z.estimatedTime ? ` · ~${z.estimatedTime} min` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Paiement */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Paiement</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENTS.map((p) => {
                const Icon = p.icon;
                const active = payment === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => setPayment(p.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                      active
                        ? 'border-brand bg-brand/5 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand/40'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-brand' : 'text-gray-400'}`} />
                    <span className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montants selon le paiement */}
          {payment === 'CASH' && (
            <div className="space-y-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
              <label className="text-xs text-gray-500 block">
                Montant reçu (espèces)
              </label>
              <input
                type="number"
                min={0}
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder={String(total || '')}
                className="w-full text-lg font-bold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
              {Number(received || 0) > 0 && (
                <div className="text-xs space-y-1">
                  {Number(received || 0) >= total ? (
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✅ Payé en totalité{change > 0 ? ` — monnaie à rendre : ${formatPrice(change)}` : ''}
                    </p>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      📒 Reste {formatPrice(total - Number(received || 0))} à crédit (rappel auto)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {payment === 'MOBILE_MONEY' && (
            <div className="space-y-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
              <label className="text-xs text-gray-500 block">
                Montant payé via Mobile Money
              </label>
              <input
                type="number"
                min={0}
                value={paidMobile}
                onChange={(e) => setPaidMobile(e.target.value)}
                placeholder={String(total || '')}
                className="w-full text-lg font-bold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
              <p className="text-[11px] text-gray-400">
                Laisse vide si le client a payé la totalité ({formatPrice(total)}).
                Montant partiel → le reste passe à crédit.
              </p>
            </div>
          )}

          {payment === 'CREDIT' && (
            <div className="space-y-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                📒 Le client emporte maintenant et paiera plus tard
              </p>
              <div>
                <label className="text-[11px] text-amber-700 dark:text-amber-300 block mb-1">
                  Échéance de paiement
                </label>
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 bg-transparent text-amber-900 dark:text-amber-100 outline-none"
                />
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Une dette de {formatPrice(total)} sera créée avec rappels automatiques.
              </p>
            </div>
          )}

          {isCredit && payment !== 'CREDIT' && (
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Échéance du reste à payer</label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 outline-none"
              />
            </div>
          )}

          {/* Remise + notes */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Remise (FCFA)</label>
              <input
                type="number"
                min={0}
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Note (optionnel)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex. table 5"
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
            </div>
          </div>

          {/* Total live */}
          <div className="rounded-2xl bg-gray-900 dark:bg-gray-800 text-white p-4 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {zoneFee > 0 && (
              <div className="flex justify-between text-xs text-gray-300">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Livraison
                </span>
                <span>{formatPrice(zoneFee)}</span>
              </div>
            )}
            {Number(discount || 0) > 0 && (
              <div className="flex justify-between text-xs text-gray-300">
                <span>Remise</span>
                <span>− {formatPrice(Number(discount || 0))}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-sm font-medium">Total</span>
              <span className="text-2xl font-bold">{formatPrice(total)}</span>
            </div>
            {payment !== 'CREDIT' && (
              <p className="text-xs text-gray-400 text-right">
                {isCredit && paidAmount > 0
                  ? `Payé ${formatPrice(paidAmount)} · reste ${formatPrice(remaining)} à crédit`
                  : `À recevoir : ${formatPrice(paidAmount > 0 && paidAmount < total ? paidAmount : total)}`}
              </p>
            )}
          </div>

          <Button
            className="w-full py-3 text-base"
            disabled={!canSubmit}
            onClick={() => createSale.mutate()}
          >
            {createSale.isPending ? (
              <Loader className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Banknote className="h-5 w-5 mr-2" />
            )}
            {createSale.isPending
              ? 'Encaissement…'
              : isCredit
                ? `Valider la vente à crédit`
                : `Encaisser ${formatPrice(paidAmount > 0 && paidAmount < total ? paidAmount : total)}`}
          </Button>

          {createSale.isError && (
            <p className="text-xs text-red-500 text-center">
              {(createSale.error as any)?.response?.data?.message ||
                (createSale.error as any)?.message ||
                'Erreur lors de l’encaissement'}
            </p>
          )}
        </Card>
      </div>

      {/* Sticky bar mobile */}
      {items.length > 0 && !createdOrder && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[11px] text-gray-500">
              {items.reduce((a, i) => a + i.quantity, 0)} articles
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(total)}
            </p>
          </div>
          <Button disabled={!canSubmit} onClick={() => createSale.mutate()}>
            {createSale.isPending ? (
              <Loader className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Banknote className="h-4 w-4 mr-1.5" />
            )}
            Encaisser
          </Button>
        </div>
      )}

      {/* ══ Modale encaisser la dette du client ══ */}
      {debtModalOpen && client && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setDebtModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-amber-600" /> Encaisser la dette
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {client.name} — doit {formatPrice(Number(client.debtBalance || 0))}
                </p>
              </div>
              <button
                onClick={() => setDebtModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {clientDebts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Toutes les dettes de ce client sont soldées 🎉</p>
                </div>
              ) : (
                clientDebts.map((d: any) => {
                  const st = debtPayState[d.id];
                  const remaining = Number(d.amount || d.remainingAmount || 0);
                  return (
                    <div
                      key={d.id}
                      className="rounded-2xl border border-gray-200 dark:border-gray-700 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatPrice(remaining)}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Réf. {d.reference || d.id?.slice(0, 8)}
                            {d.daysOverdue ? ` · ${d.daysOverdue} j de retard` : ''}
                          </p>
                        </div>
                        {remaining > 0 && d.daysOverdue ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                            En retard
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={st?.amount ?? ''}
                          placeholder={String(remaining || '')}
                          onChange={(e) =>
                            setDebtPayState((prev) => ({
                              ...prev,
                              [d.id]: { amount: e.target.value, loading: false },
                            }))
                          }
                          className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 outline-none"
                        />
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                          disabled={st?.loading}
                          onClick={() => payClientDebt(d)}
                        >
                          {st?.loading ? (
                            <Loader className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Banknote className="h-3.5 w-3.5 mr-1" />
                          )}
                          Encaisser
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
              {debtFeedback && (
                <p
                  className={`text-xs text-center ${debtFeedback.includes('✅') ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {debtFeedback}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Modale sélection client ══ */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-4 w-4 text-brand" /> Choisir un client
              </h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Nom ou téléphone…"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {/* Vente de passage */}
              <button
                onClick={() => {
                  setClient(null);
                  setPickerOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-left hover:border-brand transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Client de passage
                  </p>
                  <p className="text-xs text-gray-500">Vente sans compte (téléphone optionnel)</p>
                </div>
              </button>
              {clientsLoading && (
                <div className="flex justify-center py-6">
                  <Loader className="h-5 w-5 animate-spin text-brand" />
                </div>
              )}
              {!clientsLoading &&
                filteredClients.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setClient({
                        id: c.id,
                        name: c.name,
                        phone: c.phone || '',
                        debtBalance: Number(c.debtBalance || 0),
                      });
                      setPickerOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 text-left transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {c.name}
                      </p>
                      {c.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </p>
                      )}
                    </div>
                    {Number(c.debtBalance || 0) > 0 && (
                      <span className="shrink-0 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-full">
                        Doit {formatPrice(Number(c.debtBalance || 0))}
                      </span>
                    )}
                  </button>
                ))}
              {!clientsLoading && filteredClients.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-6">
                  Aucun client trouvé — créez-en un dans le CRM.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
