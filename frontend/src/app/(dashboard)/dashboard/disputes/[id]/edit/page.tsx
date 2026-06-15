'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scale, AlertTriangle, Save, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDispute } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const typeOptions = [
  { value: 'ORDER', label: 'Commande' },
  { value: 'BOOKING', label: 'Réservation' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'PAYMENT', label: 'Paiement' },
  { value: 'OTHER', label: 'Autre' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'CRITICAL', label: 'Critique' },
];

const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function EditDisputePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: dispute, isLoading: loadingList } = useDispute(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    reference: '',
    type: 'OTHER',
    priority: 'MEDIUM',
    relatedEntityId: '',
    amount: '',
  });

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (dispute) {
      setForm({
        title: dispute.title || '',
        description: dispute.description || '',
        reference: dispute.reference || '',
        type: dispute.type || 'OTHER',
        priority: dispute.priority || 'MEDIUM',
        relatedEntityId: dispute.relatedEntityId || '',
        amount: dispute.amount != null ? String(dispute.amount) : '',
      });
    }
  }, [dispute]);

  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/business/disputes/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-disputes'] });
      router.push('/dashboard/disputes');
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload: any = {
      title: form.title.trim(),
      description: form.description.trim(),
      reference: form.reference.trim(),
      type: form.type,
      priority: form.priority,
    };
    if (form.relatedEntityId.trim()) payload.relatedEntityId = form.relatedEntityId.trim();
    if (form.amount) payload.amount = parseFloat(form.amount);
    updateMutation.mutate(payload);
  }

  if (loadingList) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Modifier le litige"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Litiges', href: '/dashboard/disputes' },
            { label: 'Modifier' },
          ]}
        />
        <Card padding="lg">
          <div className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center mb-4">
              <Scale className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Litige introuvable</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Les détails des litiges seront disponibles prochainement</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Modifier le litige"
        description="Mettez à jour les informations du litige"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Litiges', href: '/dashboard/disputes' },
          { label: dispute.title || 'Détail', href: `/dashboard/disputes/${id}` },
          { label: 'Modifier' },
        ]}
        actions={
          <Link href={`/dashboard/disputes/${id}`}>
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Annuler</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Informations du litige</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Modifiez les détails de la réclamation</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Titre *</label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Ex: Commande non reçue"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Décrivez le litige en détail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Référence</label>
                <input
                  value={form.reference}
                  onChange={(e) => set('reference', e.target.value)}
                  placeholder="Réf. interne"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Type</label>
                <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
                  {typeOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Priorité</label>
                <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
                  {priorityOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Entité liée (optionnel)</label>
                <input
                  value={form.relatedEntityId}
                  onChange={(e) => set('relatedEntityId', e.target.value)}
                  placeholder="ID commande, réservation..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Montant litigieux</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Link href={`/dashboard/disputes/${id}`}>
            <Button type="button" variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Annuler</Button>
          </Link>
          <Button type="submit" isLoading={updateMutation.isPending}>
            {updateMutation.isPending ? null : <Save className="h-4 w-4 mr-1.5" />}
            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
