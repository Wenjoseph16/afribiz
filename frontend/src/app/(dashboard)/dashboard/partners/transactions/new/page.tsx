'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DollarSign, ChevronLeft, Save, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreatePartnerTransaction } from '@/features/partnerHooks';

const TRANSACTION_TYPES = [
  { value: 'PAIEMENT', label: 'Paiement' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'AVANCE', label: 'Avance' },
  { value: 'REMBOURSEMENT', label: 'Remboursement' },
];

export default function NewPartnerTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get('partnerId');
  const createTransaction = useCreatePartnerTransaction();

  const [type, setType] = useState('PAIEMENT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || Number(amount) <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (!partnerId) {
      setError('Partenaire non spécifié');
      return;
    }

    try {
      await createTransaction.mutateAsync({
        partnerId,
        type,
        amount: Number(amount),
        description: description.trim(),
      });
      router.push(`/dashboard/partners/${partnerId}`);
    } catch {
      setError('Erreur lors de la création de la transaction');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title="Nouveau paiement"
        description="Enregistrez un paiement, une commission, une avance ou un remboursement"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Partenaires', href: '/dashboard/partners' },
          { label: 'Détail', href: partnerId ? `/dashboard/partners/${partnerId}` : '#' },
          { label: 'Nouveau paiement' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de transaction
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TRANSACTION_TYPES.map((t) => {
                  const isActive = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all text-sm ${
                        isActive
                          ? 'border-brand bg-brand/5 dark:bg-brand/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          isActive
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {t.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant *
              </label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                placeholder="0"
                icon={<DollarSign className="h-4 w-4" />}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Paiement du contrat n°123, Commission sur vente du mois..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1.5" /> Annuler
          </Button>
          <Button type="submit" disabled={createTransaction.isPending}>
            <Save className="h-4 w-4 mr-1.5" />{' '}
            {createTransaction.isPending ? 'Création...' : 'Enregistrer le paiement'}
          </Button>
        </div>
      </form>
    </div>
  );
}
