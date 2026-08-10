'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wallet, Info, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';

export default function NewSavingsGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'ROTATING',
    currency: 'FCFA',
    contributionAmount: 0,
    frequency: 'monthly',
    maxMembers: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setLoading(true);
    try {
      const res = await apiClient.createSavingsGroup(form);
      const groupId = res.data?.data?.id;
      if (groupId) {
        router.push('/dashboard/savings/' + groupId);
      } else {
        router.push('/dashboard/savings');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const typeInfo: Record<string, { desc: string; example: string }> = {
    ROTATING: {
      desc: 'Tontine classique — chaque membre cotise et reçoit la cagnotte à tour de rôle',
      example: 'Groupe de 10 personnes, 50 000 FCFA/semaine',
    },
    FIXED_CONTRIBUTION: {
      desc: "Tous cotisent un montant fixe, l'argent reste dans la caisse commune",
      example: "Caisse d'épargne pour projets de groupe",
    },
    FREE: {
      desc: "Chacun cotise ce qu'il veut, quand il veut",
      example: "Groupe d'épargne flexible entre amis",
    },
    INVESTMENT: {
      desc: 'Les cotisations servent à investir et les bénéfices sont partagés',
      example: 'Achat groupé de marchandises en gros',
    },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <PageHeader
        title="Nouveau groupe d'épargne"
        description="Créez une tontine ou un groupe d'épargne collective"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Épargne', href: '/dashboard/savings' },
          { label: 'Nouveau groupe' },
        ]}
      />

      <Card className="p-4 bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/10 dark:to-blue-900/10 border-brand-200 dark:border-brand-800">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Sécurisé par escrow
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Toutes les cotisations et redistributions sont protégées par le système d&apos;escrow
              AfriBiz. Délai de rétractation de 24-48h selon votre niveau de vérification.
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informations générales</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du groupe *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="ex: Tontine du quartier"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description du groupe..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Configuration</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type de groupe
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
            >
              <option value="ROTATING">Tontine rotative</option>
              <option value="FIXED_CONTRIBUTION">Cotisation fixe</option>
              <option value="FREE">Libre</option>
              <option value="INVESTMENT">Investissement</option>
            </select>
            {form.type && (
              <div className="mt-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {typeInfo[form.type]?.desc}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                  Exemple: {typeInfo[form.type]?.example}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Devise
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="FCFA">FCFA</option>
                <option value="EUR">Euro</option>
                <option value="USD">Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fréquence
              </label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
                <option value="biweekly">Bi-mensuelle</option>
                <option value="daily">Quotidienne</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant de la cotisation
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.contributionAmount || ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contributionAmount: Number(e.target.value) }))
                  }
                  placeholder="50000"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {form.currency}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre max de membres
              </label>
              <input
                type="number"
                value={form.maxMembers}
                onChange={(e) => setForm((p) => ({ ...p, maxMembers: Number(e.target.value) }))}
                min={2}
                max={100}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !form.name}
            className="px-6 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer le groupe
          </button>
        </div>
      </form>
    </div>
  );
}
