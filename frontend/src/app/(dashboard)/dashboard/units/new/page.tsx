'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/services/apiClient';
import Link from 'next/link';

export default function NewUnitPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'POIDS',
    standardUnit: 'kg',
    conversionRate: '1',
    description: '',
    region: '',
  });

  const catList = ['POIDS', 'VOLUME', 'QUANTITE', 'LONGUEUR', 'SUPERFICIE'];

  const handleSubmit = async () => {
    if (!form.name || !form.standardUnit || !form.conversionRate) return;
    setSaving(true);
    try {
      await apiClient.createAfricanUnit({ ...form, conversionRate: Number(form.conversionRate) });
      router.push('/dashboard/units');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <Link
        href="/dashboard/units"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Nouvelle unité de mesure
          </h1>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name || !form.standardUnit || !form.conversionRate}
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
                Nom *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="Sac"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                {catList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unité standard *
              </label>
              <input
                value={form.standardUnit}
                onChange={(e) => setForm({ ...form, standardUnit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="kg"
              />
              <p className="text-xs text-gray-400 mt-1">Ex: kg, L, g, m</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux de conversion *
              </label>
              <input
                value={form.conversionRate}
                onChange={(e) => setForm({ ...form, conversionRate: e.target.value })}
                type="number"
                step="0.001"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="50"
              />
              <p className="text-xs text-gray-400 mt-1">1 Sac = 50 kg</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Région
            </label>
            <input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="Afrique de l'Ouest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="Unité traditionnelle utilisée pour..."
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
