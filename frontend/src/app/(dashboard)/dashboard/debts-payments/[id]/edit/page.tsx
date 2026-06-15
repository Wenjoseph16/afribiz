'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { useDebt, useUpdateDebt } from '@/features/hooks';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PARTIALLY_PAID', label: 'Partiellement payée' },
  { value: 'OVERDUE', label: 'En retard' },
  { value: 'CRITICAL', label: 'Critique' },
  { value: 'DISPUTED', label: 'Litige' },
  { value: 'SETTLED', label: 'Soldée' },
  { value: 'CANCELLED', label: 'Annulée' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Basse' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'CRITICAL', label: 'Critique' },
] as const;

const RISK_OPTIONS = [
  { value: 'LOW', label: 'Faible' },
  { value: 'MEDIUM', label: 'Moyen' },
  { value: 'HIGH', label: 'Élevé' },
  { value: 'CRITICAL', label: 'Critique' },
] as const;

const SOURCE_OPTIONS = [
  { value: 'ORDER', label: 'Commande' },
  { value: 'BOOKING', label: 'Réservation' },
  { value: 'INVOICE', label: 'Facture' },
  { value: 'SUBSCRIPTION', label: 'Abonnement' },
  { value: 'PROJECT', label: 'Projet' },
  { value: 'PHYSICAL_SALE', label: 'Vente physique' },
] as const;

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors';

const labelClass = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

export default function EditDebtPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: debt, isLoading, error, refetch } = useDebt(id);
  const updateDebt = useUpdateDebt();

  const [form, setForm] = useState({
    clientName: '',
    totalAmount: '',
    notes: '',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    riskLevel: 'MEDIUM',
    dueDate: '',
    sourceType: 'ORDER',
  });

  useEffect(() => {
    if (debt) {
      const d: any = debt;
      setForm({
        clientName: d.clientName || '',
        totalAmount: (d.totalAmount ?? d.amount ?? '')?.toString(),
        notes: d.notes || '',
        status: d.status || 'ACTIVE',
        priority: d.priority || 'MEDIUM',
        riskLevel: d.riskLevel || 'MEDIUM',
        dueDate: d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : '',
        sourceType: d.sourceType || 'ORDER',
      });
    }
  }, [debt]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (!debt)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Dette introuvable</p>
      </div>
    );

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateDebt.mutateAsync({
        id,
        data: {
          ...form,
          totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
        },
      });
      router.push(`/dashboard/debts-payments/${id}`);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <PageHeader
        title="Modifier la dette"
        description="Mettez à jour les informations de la dette"
        breadcrumbs={[
          { label: 'Dettes & Paiements', href: '/dashboard/debts-payments' },
          { label: 'Modifier' },
        ]}
        actions={
          <Link href={`/dashboard/debts-payments/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
            Informations
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nom du client *</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => update('clientName', e.target.value)}
                required
                className={inputClass}
                placeholder="Nom du client"
              />
            </div>
            <div>
              <label className={labelClass}>Montant (FCFA) *</label>
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => update('totalAmount', e.target.value)}
                required
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                className={inputClass}
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>
        </Card>

        {/* Statut & Priorité */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
            Statut &amp; Priorité
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Statut</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priorité</label>
              <select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
                className={inputClass}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Niveau de risque</label>
              <select
                value={form.riskLevel}
                onChange={(e) => update('riskLevel', e.target.value)}
                className={inputClass}
              >
                {RISK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Échéance */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
            Échéance
          </h2>
          <div>
            <label className={labelClass}>Date d&apos;échéance</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
              className={inputClass}
            />
          </div>
        </Card>

        {/* Source */}
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
            Source
          </h2>
          <div>
            <label className={labelClass}>Type de source</label>
            <select
              value={form.sourceType}
              onChange={(e) => update('sourceType', e.target.value)}
              className={inputClass}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href={`/dashboard/debts-payments/${id}`}>
            <Button variant="secondary" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={updateDebt.isPending}>
            {updateDebt.isPending ? (
              <Loader className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            {updateDebt.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}
