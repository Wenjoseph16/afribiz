'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Calendar, DollarSign, ChevronLeft, Save, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreatePartnerContract } from '@/features/partnerHooks';

export default function NewPartnerContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get('partnerId');
  const createContract = useCreatePartnerContract();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }

    if (!partnerId) {
      setError('Partenaire non spécifié');
      return;
    }

    try {
      await createContract.mutateAsync({
        partnerId,
        title: title.trim(),
        description: description.trim(),
        amount: amount ? Number(amount) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        content: content.trim(),
      });
      router.push(`/dashboard/partners/${partnerId}`);
    } catch {
      setError('Erreur lors de la création du contrat');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <PageHeader
        title="Nouveau contrat"
        description="Créez un contrat ou un accord pour ce partenaire"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Partenaires', href: '/dashboard/partners' },
          { label: 'Détail', href: partnerId ? `/dashboard/partners/${partnerId}` : '#' },
          { label: 'Nouveau contrat' },
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
                Titre du contrat *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Contrat de livraison exclusif"
                icon={<FileText className="h-4 w-4" />}
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
                placeholder="Décrivez les termes du contrat..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant
              </label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                placeholder="0"
                icon={<DollarSign className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début
              </label>
              <Input
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin
              </label>
              <Input
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contenu / Termes
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Détaillez les clauses, conditions, engagements..."
                rows={6}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1.5" /> Annuler
          </Button>
          <Button type="submit" disabled={createContract.isPending}>
            <Save className="h-4 w-4 mr-1.5" />{' '}
            {createContract.isPending ? 'Création...' : 'Créer le contrat'}
          </Button>
        </div>
      </form>
    </div>
  );
}
