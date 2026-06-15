'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, AlertTriangle, Edit2, Trash2, Loader, Save, Package, TrendingUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import { useMenuIngredients, useCreateMenuIngredient, useUpdateMenuIngredient, useDeleteMenuIngredient, useAdjustIngredientStock } from '@/features/hooks';

const CATEGORIES = ['Tous', 'LEGUME', 'VIANDE', 'POISSON', 'EPICE', 'LAITAGE', 'BOISSON', 'AUTRE'];
const CATEGORY_LABELS: Record<string, string> = {
  LEGUME: 'Légumes', VIANDE: 'Viandes', POISSON: 'Poissons',
  EPICE: 'Épices', LAITAGE: 'Produits laitiers', BOISSON: 'Boissons', AUTRE: 'Autres',
};

const STOCK_TYPES = ['IN', 'OUT', 'ADJUSTMENT', 'WASTE'];
const STOCK_TYPE_LABELS: Record<string, string> = { IN: 'Entrée stock', OUT: 'Sortie stock', ADJUSTMENT: 'Ajustement', WASTE: 'Perte' };

export default function IngredientsPage() {
  const { data: ingredientsData, isLoading } = useMenuIngredients();
  const createIngredient = useCreateMenuIngredient();
  const updateIngredient = useUpdateMenuIngredient();
  const deleteIngredient = useDeleteMenuIngredient();
  const adjustStock = useAdjustIngredientStock();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [showLowStock, setShowLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editIng, setEditIng] = useState<any>(null);
  const [stockIng, setStockIng] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', unit: '', minStock: 0, currentStock: 0, unitPrice: 0 });
  const [stockForm, setStockForm] = useState({ type: 'IN', quantity: 1, reason: '' });

  const allIngredients = Array.isArray(ingredientsData) ? ingredientsData : (ingredientsData?.ingredients || ingredientsData?.data || []);

  const filtered = allIngredients.filter((i: any) => {
    if (categoryFilter !== 'Tous' && i.category !== categoryFilter) return false;
    if (showLowStock && Number(i.stock || 0) >= Number(i.minStock || 0)) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lowStockCount = allIngredients.filter((i: any) => Number(i.stock || 0) < Number(i.minStock || 0)).length;

  const openCreate = () => {
    setEditIng(null);
    setForm({ name: '', unit: '', minStock: 0, currentStock: 0, unitPrice: 0 });
    setModalOpen(true);
  };

  const openEdit = (ing: any) => {
    setEditIng(ing);
    setForm({ name: ing.name, unit: ing.unit || '', minStock: Number(ing.minStock || 0), currentStock: Number(ing.stock || 0), unitPrice: Number(ing.unitPrice || 0) });
    setModalOpen(true);
  };

  const openStockAdjust = (ing: any) => {
    setStockIng(ing);
    setStockForm({ type: 'IN', quantity: 1, reason: '' });
    setStockModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editIng) {
        await updateIngredient.mutateAsync({ id: editIng.id, data: { name: form.name, unit: form.unit || undefined, currentStock: Number(form.currentStock), minStock: Number(form.minStock), unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined } });
      } else {
        await createIngredient.mutateAsync({ name: form.name, unit: form.unit || undefined, currentStock: Number(form.currentStock), minStock: Number(form.minStock), unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined });
      }
      setModalOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleStockAdjust = async () => {
    if (!stockIng || !stockForm.quantity) return;
    setSaving(true);
    try {
      await adjustStock.mutateAsync({ id: stockIng.id, data: { type: stockForm.type, quantity: Number(stockForm.quantity), reason: stockForm.reason || undefined } });
      setStockModalOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await deleteIngredient.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/menu" className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock cuisine</h1><p className="text-sm text-gray-500">Gérez vos ingrédients</p></div>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1.5" />Ajouter</Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ingrédients', value: allIngredients.length, icon: AlertTriangle, color: 'bg-blue-100 text-blue-600' },
          { label: 'Stock faible', value: lowStockCount, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
          { label: 'Valeur stock', value: formatPrice(allIngredients.reduce((a: number, i: any) => a + (Number(i.stock || 0) * Number(i.unitPrice || 0)), 0)), icon: Package, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Alertes', value: lowStockCount, icon: AlertTriangle, color: 'bg-amber-100 text-amber-600' },
        ].map((s) => (
          <Card key={s.label} className="p-3"><div className="flex items-center gap-2"><div className={cn('p-1.5 rounded-lg', s.color)}><s.icon className="w-3.5 h-3.5" /></div><div><p className="text-xs text-gray-500">{s.label}</p><p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p></div></div></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-10" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap', categoryFilter === cat ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>{CATEGORY_LABELS[cat] || cat}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap text-sm">
          <input type="checkbox" checked={showLowStock} onChange={e => setShowLowStock(e.target.checked)} className="rounded border-gray-300 text-brand focus:ring-brand" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Stock faible</span>
        </label>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Ingrédient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Catégorie</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Stock</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Seuil</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Prix unit.</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((ing: any) => {
              const stock = Number(ing.stock || 0);
              const minStock = Number(ing.minStock || 0);
              const isLow = stock < minStock;
              return (
                <tr key={ing.id} className={cn('hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors', isLow && 'bg-red-50 dark:bg-red-900/10')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', isLow ? 'bg-red-500' : 'bg-emerald-500')} />
                      <span className="font-medium text-gray-900 dark:text-white">{ing.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[ing.category] || ing.category || '—'}</td>
                  <td className="px-4 py-3 text-right"><span className={cn('font-medium', isLow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white')}>{stock} {ing.unit || ''}</span></td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{minStock} {ing.unit || ''}</td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{formatPrice(Number(ing.unitPrice || 0))}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openStockAdjust(ing)} className="text-brand"><TrendingUpDown className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(ing)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(ing)} className="hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editIng ? 'Modifier l\'ingrédient' : 'Nouvel ingrédient'}>
        <div className="space-y-4">
          <Input label="Nom *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Poulet, Riz, Huile..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unité" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="kg, L, pièce..." />
            <Input label="Stock actuel" type="number" min={0} value={form.currentStock} onChange={e => setForm(p => ({ ...p, currentStock: Number(e.target.value) }))} />
            <Input label="Seuil minimum" type="number" min={0} value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: Number(e.target.value) }))} />
            <Input label="Prix unitaire" type="number" min={0} value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: Number(e.target.value) }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} isLoading={saving}><Save className="w-4 h-4 mr-1.5" />{editIng ? 'Modifier' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal open={stockModalOpen} onClose={() => setStockModalOpen(false)} title={`Ajuster le stock - ${stockIng?.name || ''}`}>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
            <span className="text-gray-500">Stock actuel : </span><span className="font-bold text-gray-900 dark:text-white">{Number(stockIng?.stock || 0)} {stockIng?.unit || ''}</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type d'opération</label>
            <select value={stockForm.type} onChange={e => setStockForm(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
              {STOCK_TYPES.map(t => <option key={t} value={t}>{STOCK_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <Input label="Quantité" type="number" min={1} value={stockForm.quantity} onChange={e => setStockForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
          <Input label="Raison (optionnelle)" value={stockForm.reason} onChange={e => setStockForm(p => ({ ...p, reason: e.target.value }))} placeholder="Ex: Livraison fournisseur, perte..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setStockModalOpen(false)}>Annuler</Button>
            <Button onClick={handleStockAdjust} isLoading={saving}><TrendingUpDown className="w-4 h-4 mr-1.5" />Valider</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Supprimer l'ingrédient" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Êtes-vous sûr de vouloir supprimer <strong>{deleteConfirm?.name}</strong> ?</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
          <Button onClick={handleDelete} isLoading={saving} className="bg-red-500 hover:bg-red-600">Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
