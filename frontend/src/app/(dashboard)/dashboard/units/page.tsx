'use client';

import { useState, useEffect } from 'react';
import {
  Ruler,
  Plus,
  Scale,
  Package,
  ArrowLeftRight,
  Loader2,
  AlertCircle,
  Search,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { apiClient } from '@/services/apiClient';

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [convUnitId, setConvUnitId] = useState('');
  const [convValue, setConvValue] = useState('1');
  const [convResult, setConvResult] = useState<any>(null);
  const [filterCat, setFilterCat] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newUnit, setNewUnit] = useState({
    name: '',
    category: 'POIDS',
    standardUnit: 'kg',
    conversionRate: '1',
    description: '',
    region: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, cRes] = await Promise.all([
        apiClient
          .getAfricanUnits({ category: filterCat || undefined })
          .catch(() => ({ data: { data: [] } })),
        apiClient.getAfricanUnitCategories().catch(() => ({ data: { data: [] } })),
      ]);
      setUnits(uRes.data?.data || []);
      setCategories(cRes.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCat]);

  const handleCreate = async () => {
    try {
      await apiClient.createAfricanUnit({
        ...newUnit,
        conversionRate: Number(newUnit.conversionRate),
      });
      setShowNew(false);
      setNewUnit({
        name: '',
        category: 'POIDS',
        standardUnit: 'kg',
        conversionRate: '1',
        description: '',
        region: '',
      });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.deleteAfricanUnit(deleteTarget);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
    setDeleteTarget(null);
  };

  const handleConvert = async () => {
    if (!convUnitId || !convValue) return;
    try {
      const res = await apiClient.convertAfricanUnit(convUnitId, Number(convValue));
      setConvResult(res.data?.data);
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );

  const catMap = ['POIDS', 'VOLUME', 'QUANTITE', 'LONGUEUR', 'SUPERFICIE'];
  const catIcons: Record<string, any> = {
    POIDS: Scale,
    VOLUME: Package,
    QUANTITE: Ruler,
    LONGUEUR: Ruler,
    SUPERFICIE: Ruler,
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Unités de Mesure Africaines"
        description="Sac, tasse, bassine, morceau... Conversion automatique vers les unités standard"
        breadcrumbs={[{ label: 'Config' }, { label: 'Unités' }]}
        actions={
          <>
            <LiveBadge label="Temps réel" />
            <button
              onClick={() => setShowConvert(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeftRight className="w-4 h-4" /> Convertir
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 text-sm font-medium active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}{' '}
          <button onClick={loadData} className="ml-auto underline">
            Réessayer
          </button>
        </div>
      )}

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterCat ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
        >
          Toutes
        </button>
        {categories.map((c: any) => (
          <button
            key={c.category}
            onClick={() => setFilterCat(c.category)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === c.category ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
          >
            {c.category} ({c.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((u: any) => (
          <Card key={u.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{u.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {u.category}
                  {u.region ? ` · ${u.region}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleDelete(u.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm">
                <span className="text-gray-500">1 {u.name}</span> ={' '}
                <span className="font-medium text-brand-600">
                  {Number(u.conversionRate).toLocaleString()} {u.standardUnit}
                </span>
              </p>
              {u.description && <p className="text-xs text-gray-400 mt-1">{u.description}</p>}
            </div>
          </Card>
        ))}
        {units.length === 0 && (
          <Card className="p-8 text-center col-span-full">
            <Ruler className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Aucune unité
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajoutez des unités de mesure africaines pour la conversion automatique.
            </p>
          </Card>
        )}
      </div>

      {/* Modal: Nouvelle unité */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouvelle unité de mesure">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <input
                value={newUnit.name}
                onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="Sac"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <Select
                value={newUnit.category}
                onChange={(e) => setNewUnit({ ...newUnit, category: e.target.value })}
                options={catMap.map((c) => ({ value: c, label: c }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unité standard
              </label>
              <input
                value={newUnit.standardUnit}
                onChange={(e) => setNewUnit({ ...newUnit, standardUnit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="kg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux de conversion
              </label>
              <input
                value={newUnit.conversionRate}
                onChange={(e) => setNewUnit({ ...newUnit, conversionRate: e.target.value })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Région (optionnel)
            </label>
            <input
              value={newUnit.region}
              onChange={(e) => setNewUnit({ ...newUnit, region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="Afrique de l'Ouest"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!newUnit.name || !newUnit.conversionRate}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Ajouter
          </button>
        </div>
      </Modal>

      {/* Modal: Convertisseur */}
      <Modal
        open={showConvert}
        onClose={() => {
          setShowConvert(false);
          setConvResult(null);
        }}
        title="Convertisseur d'unités"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unité
            </label>
            <Select
              value={convUnitId}
              onChange={(e) => setConvUnitId(e.target.value)}
              options={[
                { value: '', label: 'Sélectionner...' },
                ...units.map((u: any) => ({
                  value: u.id,
                  label: `${u.name} → ${u.standardUnit} (×${Number(u.conversionRate)})`,
                })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valeur
            </label>
            <input
              value={convValue}
              onChange={(e) => setConvValue(e.target.value)}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <button
            onClick={handleConvert}
            disabled={!convUnitId || !convValue}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Convertir
          </button>
          {convResult && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-center">
              <p className="text-lg font-bold">
                {Number(convValue).toLocaleString()} → {convResult.value?.toLocaleString()}{' '}
                {convResult.unit}
              </p>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Supprimer l'unité"
        description="Êtes-vous sûr de vouloir supprimer cette unité de mesure ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
