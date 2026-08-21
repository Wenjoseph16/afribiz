'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

export default function NewVoiceCommandPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ command: '', action: 'SEARCH', language: 'fr', params: '{}' });

  const handleSubmit = async () => {
    if (!form.command) return;
    setSaving(true);
    try {
      await apiClient.createVoiceCommand({ ...form, params: JSON.parse(form.params || '{}') });
      router.push('/dashboard/voice');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <PageHeader
        title="Nouvelle commande vocale"
        description="Ajoutez une commande vocale pour votre business"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Voix', href: '/dashboard/voice' },
          { label: 'Nouvelle commande' },
        ]}
        actions={
          <button
            onClick={handleSubmit}
            disabled={saving || !form.command}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Création...' : 'Ajouter'}
          </button>
        }
      />

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Commande vocale *
            </label>
            <input
              value={form.command}
              onChange={(e) => setForm({ ...form, command: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
              placeholder="commander [produit]"
            />
            <p className="text-xs text-gray-400 mt-1">Mot-clé ou phrase déclencheur</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action
              </label>
              <select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="SEARCH">Recherche de produit</option>
                <option value="ORDER">Passer commande</option>
                <option value="BOOK">Réservation</option>
                <option value="CALL">Appel/Contact</option>
                <option value="INFO">Information</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Langue
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="wo">Wolof</option>
                <option value="bm">Bambara</option>
                <option value="ha">Haoussa</option>
                <option value="yo">Yoruba</option>
                <option value="ig">Igbo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paramètres (JSON)
            </label>
            <textarea
              value={form.params}
              onChange={(e) => setForm({ ...form, params: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
              placeholder='{"redirect": "/products"}'
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
