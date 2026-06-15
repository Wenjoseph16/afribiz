'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Save, ArrowLeft, Calculator } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useQuote, useUpdateQuote } from '@/features/hooks';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: quote, isLoading, error, refetch } = useQuote(id);
  const updateQuote = useUpdateQuote();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [currency, setCurrency] = useState('XOF');
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (quote && !initialized) {
      setTitle(quote.title || '');
      setDescription(quote.description || '');
      setNotes(quote.notes || '');
      setTerms(quote.terms || '');
      setClientName(quote.clientName || '');
      setClientPhone(quote.clientPhone || '');
      setClientEmail(quote.clientEmail || '');
      setValidUntil(quote.validUntil ? quote.validUntil.split('T')[0] : '');
      setCurrency(quote.currency || 'XOF');
      setTaxAmount(Number(quote.taxAmount || 0));
      setDiscountAmount(Number(quote.discountAmount || 0));
      const quoteItems: LineItem[] = (quote.items || []).map((item: any) => ({
        id: generateId(),
        description: item.description || '',
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
      }));
      setItems(quoteItems.length > 0 ? quoteItems : [{ id: generateId(), description: '', quantity: 1, unitPrice: 0 }]);
      setInitialized(true);
    }
  }, [quote, initialized]);

  const updateItem = useCallback((itemId: string, field: keyof LineItem, value: string | number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { id: generateId(), description: '', quantity: 1, unitPrice: 0 }]);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalAmount = subtotal + taxAmount - discountAmount;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Le titre est requis';
    if (!clientName.trim()) errs.clientName = 'Le nom du client est requis';
    if (items.length === 0 || items.every(i => !i.description.trim())) {
      errs.items = 'Ajoutez au moins un article';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    updateQuote.mutate(
      {
        id,
        data: {
          title,
          description,
          notes,
          terms,
          clientName,
          clientPhone,
          clientEmail,
          validUntil: validUntil || undefined,
          currency,
          taxAmount,
          discountAmount,
          items: items.map(({ description, quantity, unitPrice }) => ({
            description,
            quantity,
            unitPrice,
          })),
        },
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/quotes/${id}`);
        },
      }
    );
  };

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  if (error || !quote) {
    return (
      <ErrorState
        title="Devis introuvable"
        message="Impossible de charger les données de ce devis."
        onRetry={refetch}
      />
    );
  }

  const fieldClass = 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100';
  const labelClass = 'text-gray-700 dark:text-gray-300';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <PageHeader
        title="Modifier le devis"
        description={quote.number ? `Réf: ${quote.number}` : undefined}
        breadcrumbs={[
          { label: 'Devis', href: '/dashboard/quotes' },
          { label: quote.title || 'Devis', href: `/dashboard/quotes/${id}` },
          { label: 'Modifier' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link href={`/dashboard/quotes/${id}`}>
              <Button type="button" variant="secondary">
                <ArrowLeft className="h-4 w-4 mr-1.5" />Annuler
              </Button>
            </Link>
            <Button type="submit" isLoading={updateQuote.isPending}>
              <Save className="h-4 w-4 mr-1.5" />Enregistrer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Détails du devis</h3>
            <div className="space-y-4">
              <Input
                label="Titre"
                placeholder="Ex: Développement site web"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                className={fieldClass}
              />
              <div>
                <label className={`block text-sm font-medium ${labelClass} mb-1.5`}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Description du devis..."
                  className={`w-full px-4 py-2.5 rounded-xl border-2 ${fieldClass} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all duration-200`}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Articles</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1.5" />Ajouter
              </Button>
            </div>
            {errors.items && (
              <p className="text-sm text-red-500 mb-3">{errors.items}</p>
            )}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${fieldClass} text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none`}
                    />
                  </div>
                  <div className="w-20 shrink-0">
                    <input
                      type="number"
                      placeholder="Qté"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(item.id, 'quantity', Math.max(0, Number(e.target.value)))}
                      min={0}
                      className={`w-full px-3 py-2 rounded-lg border ${fieldClass} text-sm text-center focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none`}
                    />
                  </div>
                  <div className="w-28 shrink-0">
                    <input
                      type="number"
                      placeholder="P.U."
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                      min={0}
                      className={`w-full px-3 py-2 rounded-lg border ${fieldClass} text-sm text-right focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none`}
                    />
                  </div>
                  <div className="w-28 shrink-0 flex items-center justify-end px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {(item.quantity * item.unitPrice).toLocaleString()} FCFA
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Client</h3>
            <div className="space-y-4">
              <Input
                label="Nom"
                placeholder="Nom du client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                error={errors.clientName}
                className={fieldClass}
              />
              <Input
                label="Téléphone"
                placeholder="+225 00 00 00 00"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className={fieldClass}
              />
              <Input
                label="Email"
                type="email"
                placeholder="client@exemple.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className={fieldClass}
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Paramètres</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${labelClass} mb-1.5`}>Valable jusqu'au</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border-2 ${fieldClass} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all duration-200`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${labelClass} mb-1.5`}>Devise</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border-2 ${fieldClass} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all duration-200`}
                >
                  <option value="XOF">XOF (F CFA)</option>
                  <option value="XAF">XAF (F CFA)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              <Calculator className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Résumé financier
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Sous-total</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{subtotal.toLocaleString()} FCFA</span>
              </div>
              <Input
                label="Taxe"
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(Math.max(0, Number(e.target.value)))}
                className={fieldClass}
              />
              <Input
                label="Remise"
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                className={fieldClass}
              />
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-lg font-bold text-brand">{totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations supplémentaires</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${labelClass} mb-1.5`}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes internes..."
                  className={`w-full px-4 py-2.5 rounded-xl border-2 ${fieldClass} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all duration-200`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${labelClass} mb-1.5`}>Conditions générales</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                  placeholder="Conditions de vente..."
                  className={`w-full px-4 py-2.5 rounded-xl border-2 ${fieldClass} focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all duration-200`}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
