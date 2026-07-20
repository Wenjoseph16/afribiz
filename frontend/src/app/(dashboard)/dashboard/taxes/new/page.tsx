'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/services/apiClient';
import Link from 'next/link';

export default function NewTaxCountryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    countryCode: '',
    countryName: '',
    taxRate: '18',
    currency: 'FCFA',
    taxName: 'TVA',
  });

  const handleSubmit = async () => {
    if (!form.countryCode || !form.countryName) return;
    setSaving(true);
    try {
      await apiClient.createCountryTax({ ...form, taxRate: Number(form.taxRate) });
      router.push('/dashboard/taxes');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <Link
        href="/dashboard/taxes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Ajouter un pays (ZLECAF)
          </h1>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.countryCode || !form.countryName}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Création...' : 'Ajouter'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code pays *
              </label>
              <input
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="CI"
                maxLength={2}
              />
              <p className="text-xs text-gray-400 mt-1">Code ISO à 2 lettres</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du pays *
              </label>
              <input
                value={form.countryName}
                onChange={(e) => setForm({ ...form, countryName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="Côte d'Ivoire"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux TVA (%)
              </label>
              <input
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                type="number"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monnaie
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="FCFA">FCFA</option>
                <option value="GNF">GNF (Guinée)</option>
                <option value="MGA">MGA (Madagascar)</option>
                <option value="CDF">CDF (RDC)</option>
                <option value="NGN">NGN (Nigeria)</option>
                <option value="ZAR">ZAR (Afrique du Sud)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de la taxe
            </label>
            <input
              value={form.taxName}
              onChange={(e) => setForm({ ...form, taxName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="TVA"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
