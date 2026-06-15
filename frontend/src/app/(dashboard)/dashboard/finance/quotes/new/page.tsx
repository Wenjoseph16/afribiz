'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, FileText, User, Phone, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useCreateQuote } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const createQuote = useCreateQuote();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [validityDays, setValidityDays] = useState(30);
  const [currency, setCurrency] = useState('FCFA');
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, field: keyof QuoteItem, value: any) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
  const total = subtotal + Number(tax) - Number(discount);

  const handleSubmit = async () => {
    if (!clientName || !clientPhone || items.some(i => !i.description)) return;
    setSubmitting(true);
    try {
      const res = await createQuote.mutateAsync({
        clientName, clientPhone, clientEmail: clientEmail || undefined,
        title: title || `Devis pour ${clientName}`,
        notes, termsConditions: terms,
        validityDays, currency, tax, discount,
        items: items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
      });
      const quoteId = (res as any)?.data?.data?.id || (res as any)?.data?.id;
      router.push(`/dashboard/finance/quotes/${quoteId}`);
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance/quotes" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau devis</h1><p className="text-sm text-gray-500">Créez un devis professionnel</p></div>
      </div>

      <Card className="p-4 sm:p-6 space-y-6">
        {/* Client */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Client *</label>
            <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nom du client"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" /></div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Téléphone *</label>
            <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+228 XX XX XX XX"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" /></div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Email</label>
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com"
              className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Titre</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Devis pour prestation..."
              className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Validité (jours)</label>
            <input type="number" value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value) || 30)} min={1}
              className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-gray-500 uppercase">Articles / Services</label>
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" />Ajouter</Button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="Description" className="sm:col-span-2 p-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100" />
                  <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    min={1} placeholder="Qté" className="p-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 w-full" />
                  <div className="flex gap-2">
                    <input type="number" value={item.unitPrice || ''} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value) || 0)}
                      min={0} placeholder="Prix unitaire" className="flex-1 p-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100" />
                    <span className="text-xs text-gray-500 self-center whitespace-nowrap">{formatPrice(item.unitPrice * item.quantity)}</span>
                  </div>
                </div>
                <button onClick={() => removeItem(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Tax & Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">TVA / Taxe</label>
            <input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value) || 0)} min={0}
              className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Remise</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} min={0}
              className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Notes & Conditions</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes pour le client..." rows={2}
            className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 resize-none mb-2" />
          <textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Conditions générales..." rows={2}
            className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 resize-none" />
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-sm">
            <div className="flex gap-4 text-gray-500 flex-wrap">
              <span>Sous-total: <strong className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</strong></span>
              {Number(tax) > 0 && <span>Taxe: <strong className="text-gray-900 dark:text-white">{formatPrice(Number(tax))}</strong></span>}
              {Number(discount) > 0 && <span>Remise: <strong className="text-red-500">-{formatPrice(Number(discount))}</strong></span>}
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">Total: {formatPrice(total)}</p>
          </div>
          <Button onClick={handleSubmit} disabled={!clientName || !clientPhone || items.some(i => !i.description) || submitting} className="w-full sm:w-auto">
            {submitting ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
            {submitting ? 'Création...' : `Créer le devis — ${formatPrice(total)}`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
