'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreateDebt } from '@/features/hooks';

export default function NewDebtPage() {
  const router = useRouter();
  const createDebt = useCreateDebt();
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', amount: '', dueDate: '',
    description: '', priority: 'MEDIUM',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createDebt.mutateAsync({
        ...form,
        amount: form.amount ? parseFloat(form.amount) : undefined,
      });
      router.push('/dashboard/debts-payments');
    } catch (e) { console.error(e); }
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Nouvelle dette" description="Ajoutez une dette client"
        breadcrumbs={[{ label: 'Dettes & Paiements', href: '/dashboard/debts-payments' }, { label: 'Nouveau' }]}
        actions={<Link href="/dashboard/debts-payments"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du client *</label>
              <input type="text" value={form.clientName} onChange={e => update('clientName', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email du client *</label>
              <input type="email" value={form.clientEmail} onChange={e => update('clientEmail', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant (FCFA) *</label>
              <input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} required min="0" step="0.01"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date d&apos;échéance</label>
              <input type="date" value={form.dueDate} onChange={e => update('dueDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => update('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorité</label>
            <select value={form.priority} onChange={e => update('priority', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/dashboard/debts-payments"><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={createDebt.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{createDebt.isPending ? 'Création...' : 'Créer la dette'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
