'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageCircle, Loader2, AlertCircle, ArrowLeft, Save, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/services/apiClient';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'MARKETING',
    language: 'fr',
    body: '',
    header: '',
    footer: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const templates = await apiClient.getWhatsAppTemplates();
        const t = (templates.data?.data || []).find((t: any) => t.id === params.id);
        if (t) {
          setTemplate(t);
          setForm({
            name: t.name || '',
            category: t.category || 'MARKETING',
            language: t.language || 'fr',
            body: t.body || '',
            header: t.header || '',
            footer: t.footer || '',
          });
        } else {
          setError('Template non trouvé');
        }
      } catch (e: any) {
        setError(e?.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.updateWhatsAppTemplate(params.id as string, form);
      router.push('/dashboard/whatsapp');
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );

  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <button
        onClick={() => router.push('/dashboard/whatsapp')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {template?.name || 'Modifier le template'}
            </h1>
            <Badge className="mt-1">{template?.status || 'DRAFT'}</Badge>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utilitaire</option>
                <option value="AUTHENTICATION">Authentification</option>
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
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Corps du message
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              En-tête (optionnel)
            </label>
            <input
              value={form.header}
              onChange={(e) => setForm({ ...form, header: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pied de page (optionnel)
            </label>
            <input
              value={form.footer}
              onChange={(e) => setForm({ ...form, footer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Aperçu
        </h3>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl max-w-sm mx-auto">
          {form.header && <p className="text-xs text-gray-500 mb-2">{form.header}</p>}
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {form.body || 'Votre message ici...'}
          </p>
          {form.footer && <p className="text-xs text-gray-500 mt-2">{form.footer}</p>}
        </div>
      </Card>
    </div>
  );
}
